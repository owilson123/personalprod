'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { uid } from '@/lib/helpers';
import { SectionHeader } from '@/app/components/ui/SectionHeader';
import { useTodoDrag } from '@/app/components/todo-drag-context';

interface Todo { id: string; text: string; done: boolean; }

interface Props { date: string; } // YYYY-MM-DD

export function TodoList({ date }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTxt, setNewTxt] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTxt, setEditTxt] = useState('');
  const [ready, setReady] = useState(false);
  const [useLocal, setUseLocal] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'above' | 'below'>('below');

  const { setDragTodo } = useTodoDrag();

  const localKey = `dash-todos-${date}`;
  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch(`/api/todos?date=${date}`);
      if (res.status === 503) { setUseLocal(true); return null; }
      if (res.ok) return await res.json();
    } catch { setUseLocal(true); }
    return null;
  }, [date]);

  useEffect(() => {
    setReady(false);
    setTodos([]);
    fetchTodos().then(data => {
      setReady(true);
      if (data && data.length > 0) {
        setTodos(data);
      } else if (data && data.length === 0) {
        try {
          const s = localStorage.getItem(localKey);
          if (s) {
            const local = JSON.parse(s) as Todo[];
            if (local.length > 0) {
              setTodos(local);
              fetch('/api/todos/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ todos: local, date }),
              }).then(() => localStorage.removeItem(localKey));
            }
          }
        } catch { /* silent */ }
      } else {
        try {
          const s = localStorage.getItem(localKey);
          if (s) setTodos(JSON.parse(s));
        } catch { /* silent */ }
      }
    });
  }, [date, fetchTodos, localKey]);

  useEffect(() => {
    if (!ready || !useLocal) return;
    localStorage.setItem(localKey, JSON.stringify(todos));
  }, [todos, ready, useLocal, localKey]);

  const add = async () => {
    if (!newTxt.trim()) return;
    const tempId = uid();
    const todo = { id: tempId, text: newTxt.trim(), done: false };
    setTodos(p => [...p, todo]);
    setNewTxt('');
    if (!useLocal) {
      try {
        const res = await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: todo.text, date }),
        });
        if (res.ok) {
          const created = await res.json();
          setTodos(p => p.map(t => t.id === tempId ? { ...t, id: created.id } : t));
        }
      } catch { /* silent */ }
    }
  };

  const toggle = async (id: string) => {
    setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
    if (!useLocal) {
      const todo = todos.find(t => t.id === id);
      if (todo) {
        try {
          await fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ done: !todo.done }),
          });
        } catch { /* silent */ }
      }
    }
  };

  const del = async (id: string) => {
    setTodos(p => p.filter(t => t.id !== id));
    if (!useLocal) {
      try { await fetch(`/api/todos/${id}`, { method: 'DELETE' }); } catch { /* silent */ }
    }
  };

  const save = async (id: string) => {
    if (editTxt.trim()) {
      setTodos(p => p.map(t => t.id === id ? { ...t, text: editTxt.trim() } : t));
      if (!useLocal) {
        try {
          await fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: editTxt.trim() }),
          });
        } catch { /* silent */ }
      }
    }
    setEditId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetDone: boolean) => {
    if (!draggingId || targetDone) return;
    if (!e.dataTransfer.types.includes('application/todo-json')) return;

    const sorted = [...todos].sort((a, b) => Number(a.done) - Number(b.done));
    const fromIdx = sorted.findIndex(x => x.id === draggingId);
    const toIdx = sorted.findIndex(x => x.id === targetId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIdx, 1);
    const insertAt = dragOverPos === 'above' ? toIdx : toIdx + 1;
    reordered.splice(insertAt > fromIdx ? insertAt - 1 : insertAt, 0, moved);

    setTodos(reordered);
    setDragOverId(null);

    if (!useLocal) {
      reordered.forEach((item, idx) => {
        if (!item.done) {
          fetch(`/api/todos/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ position: idx }),
          }).catch(() => {});
        }
      });
    }
  };

  const isPast = date < today;
  const sorted = [...todos].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="To-Do List" accent="#6366f1" />
      <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2">
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
          {todos.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {isPast ? 'No tasks for this day.' : 'No tasks yet — add one below.'}
              </p>
            </div>
          )}
          {sorted.map(t => {
            const canDrag = !t.done && editId !== t.id;
            const isOver = draggingId && dragOverId === t.id && draggingId !== t.id;
            const showAbove = isOver && dragOverPos === 'above';
            const showBelow = isOver && dragOverPos === 'below';

            return (
              <div key={t.id}>
                {showAbove && (
                  <div style={{ height: 2, background: 'var(--accent-blue)', borderRadius: 2, margin: '1px 8px', opacity: 0.8 }} />
                )}
                <div
                  draggable={canDrag}
                  onDragStart={e => {
                    setDraggingId(t.id);
                    setDragTodo({ id: t.id, text: t.text });
                    e.dataTransfer.setData('application/todo-json', JSON.stringify({ id: t.id, text: t.text }));
                    e.dataTransfer.effectAllowed = 'copyMove';
                    const ghost = document.createElement('div');
                    ghost.textContent = t.text;
                    ghost.style.cssText = [
                      'position:fixed', 'top:-200px', 'left:0',
                      'background:#1e1f2e', 'color:#fff', 'font-size:13px', 'font-weight:600',
                      'font-family:Inter,system-ui,sans-serif',
                      'padding:8px 16px', 'border-radius:10px',
                      'border:1px solid #4f7df9',
                      'box-shadow:0 8px 24px rgba(79,125,249,0.4)',
                      'pointer-events:none', 'white-space:nowrap',
                      'max-width:240px', 'overflow:hidden', 'text-overflow:ellipsis',
                    ].join(';');
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
                    requestAnimationFrame(() => {
                      if (document.body.contains(ghost)) document.body.removeChild(ghost);
                    });
                  }}
                  onDragOver={e => {
                    if (!draggingId || draggingId === t.id || t.done) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const pos = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
                    setDragOverId(t.id);
                    setDragOverPos(pos);
                  }}
                  onDrop={e => handleDrop(e, t.id, t.done)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragTodo(null);
                    setDragOverId(null);
                  }}
                  className={`flex items-center rounded-lg px-2.5 py-1 group gap-2 transition-all ${draggingId === t.id ? 'opacity-40 scale-95' : ''}`}
                  style={{
                    background: t.done ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
                    border: `1px solid ${t.done ? 'rgba(34,197,94,0.12)' : 'var(--border-subtle)'}`,
                    cursor: canDrag ? 'grab' : 'default',
                    opacity: t.done ? 0.65 : 1,
                  }}
                >
                  {canDrag && (
                    <div
                      className="opacity-0 group-hover:opacity-30 transition-opacity shrink-0"
                      style={{ color: 'var(--text-secondary)', lineHeight: 0 }}
                    >
                      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                        <circle cx="3" cy="3"  r="1.3"/>
                        <circle cx="7" cy="3"  r="1.3"/>
                        <circle cx="3" cy="7"  r="1.3"/>
                        <circle cx="7" cy="7"  r="1.3"/>
                        <circle cx="3" cy="11" r="1.3"/>
                        <circle cx="7" cy="11" r="1.3"/>
                      </svg>
                    </div>
                  )}
                  {editId === t.id ? (
                    <input autoFocus value={editTxt}
                      onChange={e => setEditTxt(e.target.value)}
                      onBlur={() => save(t.id)}
                      onKeyDown={e => { if (e.key === 'Enter') save(t.id); if (e.key === 'Escape') setEditId(null); }}
                      className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none border-b"
                      style={{ color: 'var(--text-main)', borderColor: 'var(--accent-blue)' }} />
                  ) : (
                    <span
                      onDoubleClick={() => { setEditId(t.id); setEditTxt(t.text); }}
                      title={canDrag ? 'Drag to reorder · Drag to time block · Double-click to edit' : 'Double-click to edit'}
                      className="flex-1 min-w-0 text-sm truncate select-none"
                      style={{ color: t.done ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: t.done ? 'line-through' : 'none' }}>
                      {t.text}
                    </span>
                  )}
                  <button
                    onClick={() => toggle(t.id)}
                    className="transition-all"
                    style={{
                      width: 22, height: 22, flexShrink: 0,
                      borderRadius: 6,
                      border: t.done ? 'none' : '1px solid var(--border-main)',
                      background: t.done ? 'var(--accent-green)' : 'transparent',
                      cursor: 'pointer',
                      boxShadow: t.done ? '0 0 10px rgba(0,208,132,0.3)' : 'none',
                    }}
                  />
                  <button onClick={() => del(t.id)}
                    className="flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    style={{ width: 20, height: 20, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    ×
                  </button>
                </div>
                {showBelow && (
                  <div style={{ height: 2, background: 'var(--accent-blue)', borderRadius: 2, margin: '1px 8px', opacity: 0.8 }} />
                )}
              </div>
            );
          })}
        </div>
        {!isPast && (
          <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-main)' }}>
            <input value={newTxt} onChange={e => setNewTxt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Add a new task…"
              className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none border transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-main)' }} />
            <button onClick={add} disabled={!newTxt.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-blue-deep))' }}>
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
