'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isSameDay } from 'date-fns';
import { uid, getWeekDays } from '@/lib/helpers';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

interface Habit { id: string; name: string; checks: boolean[]; }

const SEED_HABITS: Habit[] = [
  { id: 'h1', name: 'Exercise', checks: Array(7).fill(false) },
  { id: 'h2', name: 'Read', checks: Array(7).fill(false) },
  { id: 'h3', name: 'Meditate', checks: Array(7).fill(false) },
];

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(SEED_HABITS);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [useLocal, setUseLocal] = useState(false);

  const weekDays = today ? getWeekDays(today) : [];
  const dayLabels = weekDays.map(d => ({
    short: format(d, 'EEE'),
    date: format(d, 'd'),
    isToday: today ? isSameDay(d, today) : false,
  }));
  const todayIdx = today ? (today.getDay() + 6) % 7 : -1;

  const fetchHabits = useCallback(async () => {
    if (!today) return null;
    const from = format(weekDays[0], 'yyyy-MM-dd');
    const to = format(weekDays[6], 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/habits?from=${from}&to=${to}`);
      if (res.status === 503) { setUseLocal(true); return null; }
      if (res.ok) return await res.json();
    } catch { setUseLocal(true); }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  useEffect(() => { setToday(new Date()); }, []);

  useEffect(() => {
    if (!today) return;
    fetchHabits().then(data => {
      if (data && data.length > 0) {
        // Map DB habits with checks per weekday
        setHabits(data.map((h: { id: string; name: string; checks: boolean[] }) => ({
          id: h.id,
          name: h.name,
          checks: h.checks || Array(7).fill(false),
        })));
      }
    });
  }, [today, fetchHabits]);

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
      <SectionHeader title="Habit Tracker" />
      <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2">
        <div className="flex items-end mb-1.5 gap-2">
          <div className="flex-1 min-w-0" />
          <div className="flex gap-1 shrink-0">
            {dayLabels.map((d, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: 22 }}>
                <span style={{
                  fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: d.isToday ? '#4f7df9' : '#52536a',
                }}>{d.short}</span>
                <span style={{ fontSize: 9, color: d.isToday ? '#4f7df9' : '#3f4050' }}>{d.date}</span>
              </div>
            ))}
          </div>
          <div style={{ width: 20 }} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
          {habits.map(h => (
            <div key={h.id} className="flex items-center rounded-lg px-2.5 py-1 group gap-2" style={{ background: '#1a1b23' }}>
              {editId === h.id ? (
                <input autoFocus value={h.name}
                  onChange={e => rename(h.id, e.target.value)}
                  onBlur={() => setEditId(null)}
                  onKeyDown={e => e.key === 'Enter' && setEditId(null)}
                  className="flex-1 min-w-0 bg-transparent text-sm text-white focus:outline-none border-b border-blue-500" />
              ) : (
                <span className="flex-1 min-w-0 text-sm text-white truncate select-none"
                  onDoubleClick={() => setEditId(h.id)} title="Double-click to rename">
                  {h.name}
                </span>
              )}

              <div className="flex gap-1 shrink-0">
                {h.checks.map((checked, i) => {
                  const isToday = i === todayIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(h.id, i)}
                      title={weekDays[i] ? format(weekDays[i], 'EEE d MMM') : ''}
                      className="transition-all"
                      style={{
                        width: 22, height: 22, flexShrink: 0, borderRadius: 5,
                        border: checked ? 'none' : isToday ? '2px solid rgba(79,125,249,0.6)' : '1px solid #2a2b3d',
                        background: checked ? '#00d084' : 'transparent',
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
                style={{ width: 20, height: 20, color: '#52536a' }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4757')}
                onMouseOut={e => (e.currentTarget.style.color = '#52536a')}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #2a2b3d' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add a new habit…"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none border transition-all"
            style={{ background: '#242530', borderColor: '#2a2b3d' }} />
          <button onClick={add} disabled={!newName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40 shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f7df9, #3b6ae8)' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
