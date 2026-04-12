'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { uid, getWeekDays } from '@/lib/helpers';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

interface Habit { id: string; name: string; checks: boolean[]; }

interface Props { selectedDate: string; } // YYYY-MM-DD

const SEED_HABITS: Habit[] = [
  { id: 'h1', name: 'Exercise', checks: Array(7).fill(false) },
  { id: 'h2', name: 'Read',     checks: Array(7).fill(false) },
  { id: 'h3', name: 'Meditate', checks: Array(7).fill(false) },
];

export function HabitTracker({ selectedDate }: Props) {
  const [habits, setHabits] = useState<Habit[]>(SEED_HABITS);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState(false);

  const selectedDateObj = parseISO(selectedDate);
  const actualToday = new Date();
  const weekDays = getWeekDays(selectedDateObj);

  const dayLabels = weekDays.map(d => {
    const isActualToday = isSameDay(d, actualToday);
    const isSelected = format(d, 'yyyy-MM-dd') === selectedDate;
    return { short: format(d, 'EEE'), date: format(d, 'd'), isActualToday, isSelected };
  });

  // Index of selected date in the week (for highlight)
  const selectedIdx = weekDays.findIndex(d => format(d, 'yyyy-MM-dd') === selectedDate);

  const fetchHabits = useCallback(async () => {
    const from = format(weekDays[0], 'yyyy-MM-dd');
    const to = format(weekDays[6], 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/habits?from=${from}&to=${to}`);
      if (res.status === 503) { setUseLocal(true); return null; }
      if (res.ok) return await res.json();
    } catch { setUseLocal(true); }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    fetchHabits().then(data => {
      if (data && data.length > 0) {
        setHabits(data.map((h: { id: string; name: string; checks: boolean[] }) => ({
          id: h.id, name: h.name, checks: h.checks || Array(7).fill(false),
        })));
      }
    });
  }, [fetchHabits]);

  const toggle = async (id: string, i: number) => {
    setHabits(p => p.map(h => h.id === id
      ? { ...h, checks: h.checks.map((c, j) => j === i ? !c : c) }
      : h));
    if (!useLocal && weekDays[i]) {
      try {
        await fetch(`/api/habits/${id}/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: format(weekDays[i], 'yyyy-MM-dd') }),
        });
      } catch { /* silent */ }
    }
  };

  const add = async () => {
    if (!newName.trim()) return;
    const tempId = uid();
    setHabits(p => [...p, { id: tempId, name: newName.trim(), checks: Array(7).fill(false) }]);
    const name = newName.trim();
    setNewName('');
    if (!useLocal) {
      try {
        const res = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          const created = await res.json();
          setHabits(p => p.map(h => h.id === tempId ? { ...h, id: created.id } : h));
        }
      } catch { /* silent */ }
    }
  };

  const rename = async (id: string, name: string) => {
    setHabits(p => p.map(h => h.id === id ? { ...h, name } : h));
    if (!useLocal) {
      try {
        await fetch(`/api/habits/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      } catch { /* silent */ }
    }
  };

  const del = async (id: string) => {
    setHabits(p => p.filter(h => h.id !== id));
    if (!useLocal) {
      try { await fetch(`/api/habits/${id}`, { method: 'DELETE' }); } catch { /* silent */ }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Habit Tracker" accent="#22c55e" />
      <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2">

        {/* Day header — px + 1px border offset matches the rounded row cards below */}
        <div className="flex items-end mb-1.5 gap-2" style={{ paddingLeft: 11, paddingRight: 11 }}>
          <div className="flex-1 min-w-0" />
          <div className="flex gap-1 shrink-0">
            {dayLabels.map((d, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: 22 }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: d.isSelected ? 'var(--accent-blue)' : d.isActualToday ? 'var(--accent-blue)' : 'var(--text-muted)',
                }}>{d.short}</span>
                <span style={{
                  fontSize: 9,
                  color: d.isSelected ? 'var(--accent-blue)' : d.isActualToday ? 'var(--accent-blue)' : 'var(--border-hover)',
                }}>{d.date}</span>
              </div>
            ))}
          </div>
          <div style={{ width: 20 }} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
          {habits.map(h => (
            <div key={h.id} className="flex items-center rounded-lg px-2.5 py-1 group gap-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              {editId === h.id ? (
                <input autoFocus value={h.name}
                  onChange={e => rename(h.id, e.target.value)}
                  onBlur={() => setEditId(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditId(null)}
                  className="flex-1 min-w-0 text-sm bg-transparent focus:outline-none border-b"
                  style={{ color: 'var(--text-main)', borderColor: 'var(--accent-blue)' }} />
              ) : (
                <span className="flex-1 min-w-0 text-sm truncate select-none"
                  style={{ color: 'var(--text-main)' }}
                  onDoubleClick={() => setEditId(h.id)} title="Double-click to rename">
                  {h.name}
                </span>
              )}

              <div className="flex gap-1 shrink-0">
                {h.checks.map((checked, i) => {
                  const isSelected = i === selectedIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(h.id, i)}
                      title={weekDays[i] ? format(weekDays[i], 'EEE d MMM') : ''}
                      className="transition-all"
                      style={{
                        width: 22, height: 22, flexShrink: 0, borderRadius: 5,
                        border: checked ? 'none' : isSelected ? '2px solid rgba(79,125,249,0.6)' : '1px solid var(--border-main)',
                        background: checked ? 'var(--accent-green)' : 'transparent',
                        cursor: 'pointer',
                        boxShadow: checked ? '0 0 10px rgba(0,208,132,0.3)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    />
                  );
                })}
              </div>

              <button onClick={() => del(h.id)}
                className="flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-all shrink-0"
                style={{ width: 20, height: 20, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-main)' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add a new habit…"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none border transition-all"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-main)' }} />
          <button onClick={add} disabled={!newName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-blue-deep))' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
