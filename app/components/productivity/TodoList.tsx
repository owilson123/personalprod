'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { uid } from '@/lib/helpers';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

interface Todo { id: string; text: string; done: boolean; }

interface Props { date: string; } // YYYY-MM-DD

export function TodoList({ date }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTxt, setNewTxt] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editTxt, setEditTxt] = useState('');
  const [ready, setReady] = useState(false);
  const [useLocal, setUseLocal] = useState(false);

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

  const isPast = date < today;

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="To-Do List" />
      <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2">
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
          {todos.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: '#52536a', fontSize: 13 }}>
                {isPast ? 'No tasks for this day.' : 'No tasks yet — add one below.'}
              </p>
            </div>
          )}
          {todos.map(t => (
            <div key={t.id}
              className={`flex items-center rounded-lg px-2.5 py-1 group gap-2 transition-all ${t.done ? 'opacity-60' : ''}`}
              style={{ background: '#1a1b23' }}>
              {editId === t.id ? (
                <input autoFocus value={editTxt}
                  onChange={e => setEditTxt(e.target.value)}
                  onBlur={() => save(t.id)}
                  onKeyDown={e => { if (e.key === 'Enter') save(t.id); if (e.key === 'Escape') setEditId(null); }}
                  className="flex-1 min-w-0 bg-transparent text-sm text-white focus:outline-none border-b border-blue-500" />
              ) : (
                <span
                  onDoubleClick={() => { setEditId(t.id); setEditTxt(t.text); }}
                  title="Double-click to edit"
                  className={`flex-1 min-w-0 text-sm truncate select-none cursor-pointer ${t.done ? 'line-through' : 'text-white'}`}
                  style={t.done ? { color: '#52536a' } : {}}>
                  {t.text}
                </span>
              )}
              <button
                onClick={() => toggle(t.id)}
                className="transition-all"
                style={{
                  width: 22, height: 22, flexShrink: 0,
                  borderRadius: 6,
                  border: t.done ? 'none' : '1px solid #2a2b3d',
                  background: t.done ? '#00d084' : 'transparent',
                  cursor: 'pointer',
                  boxShadow: t.done ? '0 0 10px rgba(0,208,132,0.3)' : 'none',
                }}
              />
              <button onClick={() => del(t.id)}
                className="flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-all shrink-0"
                style={{ width: 20, height: 20, color: '#52536a' }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4757')}
                onMouseOut={e => (e.currentTarget.style.color = '#52536a')}>
                ×
              </button>
            </div>
          ))}
        </div>
        {!isPast && (
          <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #2a2b3d' }}>
            <input value={newTxt} onChange={e => setNewTxt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Add a new task…"
              className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none border transition-all"
              style={{ background: '#242530', borderColor: '#2a2b3d' }} />
            <button onClick={add} disabled={!newTxt.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #4f7df9, #3b6ae8)' }}>
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
