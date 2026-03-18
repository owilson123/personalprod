'use client';

import {
  useState, useEffect, useRef, useCallback,
  type MouseEvent as RMouseEvent,
  type PointerEvent as RPointerEvent,
} from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeBlock {
  id: string;
  task: string;
  startMinute: number;
  endMinute: number;
  color: string;
}

interface Habit  { id: string; name: string; checks: boolean[]; }
interface Todo   { id: string; text: string; done: boolean; }
interface NewsItem { title: string; url: string; }

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  '#3b82f6','#8b5cf6','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#ec4899','#f97316',
];

const HOURS        = Array.from({ length: 24 }, (_, i) => i);
const PX_PER_HOUR  = 64;
const PX_PER_MIN   = PX_PER_HOUR / 60;
const LABEL_W      = 52;

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _n = 0;
const uid   = () => `${++_n}-${Math.random().toString(36).slice(2, 6)}`;
const pad   = (n: number) => String(n).padStart(2, '0');
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function minsToLabel(m: number) {
  const h    = Math.floor(m / 60) % 24;
  const min  = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh   = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${pad(min)} ${ampm}`;
}

function formatHour(h: number) {
  if (h === 0)  return '12 AM';
  if (h < 12)  return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function snapToFive(m: number) { return Math.round(m / 5) * 5; }

// Returns Mon–Sun dates of the current week (Mon = index 0)
function getWeekDays(from: Date): Date[] {
  const monday = startOfWeek(from, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ─── Clock ────────────────────────────────────────────────────────────────────

function Clock() {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const tick = () => setTxt(format(new Date(), 'EEEE, MMMM d yyyy — HH:mm:ss'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (!txt) return <div className="h-5 w-72 rounded animate-pulse" style={{ background: '#2a2b32' }} />;
  return <span className="text-sm font-medium tabular-nums" style={{ color: '#8e8ea0' }}>{txt}</span>;
}

// ─── useClientNow ─────────────────────────────────────────────────────────────

function useClientNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ endMin, now }: { endMin: number; now: Date }) {
  const curMin = now.getHours() * 60 + now.getMinutes();
  const sec    = (endMin - curMin) * 60 - now.getSeconds();
  if (sec <= 0) return <span style={{ color: '#f87171', fontSize: 10 }} className="font-mono">Done</span>;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <span style={{ fontSize: 10, opacity: .7 }} className="font-mono">
      {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
    </span>
  );
}

// ─── Block Modal ──────────────────────────────────────────────────────────────

interface BlockModalProps {
  initialStart: number;
  initialEnd:   number;
  initialTask:  string;
  onSave:   (task: string, start: number, end: number) => void;
  onDelete?: () => void;
  onClose:  () => void;
}

function BlockModal({ initialStart, initialEnd, initialTask, onSave, onDelete, onClose }: BlockModalProps) {
  const [task,  setTask]  = useState(initialTask);
  const [start, setStart] = useState(initialStart);
  const [end,   setEnd]   = useState(initialEnd);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const save = () => {
    if (!task.trim() || end <= start) return;
    onSave(task.trim(), start, end);
    onClose();
  };

  const startH = Math.floor(start / 60);
  const startM = start % 60;
  const endH   = Math.floor(end / 60);
  const endM   = end % 60;

  const sel = "text-white text-sm rounded-lg px-2 py-2 focus:outline-none border transition-colors";
  const selStyle = { background: '#40414f', borderColor: '#565869' };
  const minOpts = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{ background: '#2a2b32', border: '1px solid #3a3b44' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white" style={{ fontSize: 17 }}>
            {initialTask ? `Edit: ${initialTask}` : 'New Time Block'}
          </h3>
          <button onClick={onClose} style={{ color: '#8e8ea0', fontSize: 22, lineHeight: 1 }}
            className="hover:text-white transition-colors">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8e8ea0' }}>
              Task name
            </label>
            <input
              ref={ref}
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="What are you working on?"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none border transition-colors"
              style={{ background: '#40414f', borderColor: '#565869' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8e8ea0' }}>Start</label>
              <div className="flex gap-1.5">
                <select value={startH} onChange={e => setStart(+e.target.value * 60 + startM)} className={`${sel} flex-1`} style={selStyle}>
                  {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <select value={startM} onChange={e => setStart(startH * 60 + +e.target.value)} className={`${sel} w-16`} style={selStyle}>
                  {minOpts.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8e8ea0' }}>End</label>
              <div className="flex gap-1.5">
                <select value={endH} onChange={e => setEnd(+e.target.value * 60 + endM)} className={`${sel} flex-1`} style={selStyle}>
                  {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <select value={endM} onChange={e => setEnd(endH * 60 + +e.target.value)} className={`${sel} w-16`} style={selStyle}>
                  {minOpts.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {end <= start && (
            <p style={{ color: '#f87171', fontSize: 12 }}>End time must be after start time.</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {onDelete && (
            <button onClick={() => { onDelete(); onClose(); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              onMouseOut={e =>  (e.currentTarget.style.background = 'transparent')}>
              Delete
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#8e8ea0' }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#40414f'; }}
            onMouseOut={e =>  { e.currentTarget.style.color = '#8e8ea0'; e.currentTarget.style.background = 'transparent'; }}>
            Cancel
          </button>
          <button onClick={save} disabled={!task.trim() || end <= start}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#2563eb' }}
            onMouseOver={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = '#3b82f6'; }}
            onMouseOut={e =>  { e.currentTarget.style.background = '#2563eb'; }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Time Blocking Panel ──────────────────────────────────────────────────────

function TimeBlockingPanel() {
  const now          = useClientNow();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [modal, setModal]   = useState<{ start: number; end: number; task: string; id?: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const colorIdx     = useRef(0);
  const drag         = useRef<{ id: string; origStart: number; origEnd: number; pointerStartY: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(0, new Date().getHours() - 2) * PX_PER_HOUR;
    }
  }, []);

  const nowPx = now ? (now.getHours() * 60 + now.getMinutes()) * PX_PER_MIN : -999;

  const handleCanvasClick = (e: RMouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    const rect   = containerRef.current.getBoundingClientRect();
    const scrollY = scrollRef.current?.scrollTop ?? 0;
    const y       = e.clientY - rect.top + scrollY;
    const rawMin  = y / PX_PER_MIN;
    const snap    = snapToFive(rawMin);
    const start   = clamp(snap, 0, 23 * 60 + 30);
    const end     = clamp(start + 30, 0, 24 * 60); // default 30 min
    setModal({ start, end, task: '' });
  };

  const startDrag = (e: RPointerEvent<HTMLDivElement>, block: TimeBlock) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      id:            block.id,
      origStart:     block.startMinute,
      origEnd:       block.endMinute,
      pointerStartY: e.clientY,
    };
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const d        = drag.current;
    const deltaMin = snapToFive((e.clientY - d.pointerStartY) / PX_PER_MIN);
    const dur      = d.origEnd - d.origStart;
    const ns       = clamp(d.origStart + deltaMin, 0, 24 * 60 - dur);
    setBlocks(prev => prev.map(b => b.id === d.id ? { ...b, startMinute: ns, endMinute: ns + dur } : b));
  };

  const onPointerUp = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    drag.current = null;
  };

  const saveBlock = (task: string, start: number, end: number) => {
    if (modal?.id) {
      setBlocks(prev => prev.map(b => b.id === modal.id ? { ...b, task, startMinute: start, endMinute: end } : b));
    } else {
      const color = COLORS[colorIdx.current % COLORS.length];
      colorIdx.current++;
      setBlocks(prev => [...prev, { id: uid(), task, startMinute: start, endMinute: end, color }]);
    }
  };

  return (
    <div className="flex flex-col h-full select-none">
      <SectionHeader title="Time Blocking" subtitle={mounted && now ? format(now, 'EEE, MMM d') : ''} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          ref={containerRef}
          className="relative"
          style={{ height: 24 * PX_PER_HOUR }}
          onClick={handleCanvasClick}
        >
          {/* Hour rows */}
          {HOURS.map(h => (
            <div key={h} className="absolute left-0 right-0 flex pointer-events-none"
              style={{ top: h * PX_PER_HOUR, height: PX_PER_HOUR }}>
              <div className="flex items-start justify-end pt-1 pr-2 shrink-0" style={{ width: LABEL_W }}>
                <span style={{ fontSize: 11, color: '#565869', fontWeight: 500 }}>{formatHour(h)}</span>
              </div>
              <div className="flex-1 border-t" style={{ borderColor: '#2e2f38' }} />
            </div>
          ))}

          {/* Half-hour ticks */}
          {HOURS.map(h => (
            <div key={`hh-${h}`} className="absolute pointer-events-none"
              style={{ top: h * PX_PER_HOUR + PX_PER_HOUR / 2, left: LABEL_W, right: 0, borderTop: '1px dashed #262730' }} />
          ))}

          {/* Hover overlay — pointer events ON so clicks land here */}
          <div className="absolute inset-0 cursor-pointer" style={{ left: LABEL_W, zIndex: 1 }} />

          {/* Now line */}
          {mounted && now && (
            <div className="absolute right-0 flex items-center pointer-events-none z-10"
              style={{ top: nowPx, left: LABEL_W - 4 }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#ef4444', marginLeft: -3 }} />
              <div className="flex-1" style={{ borderTop: '2px solid #ef4444' }} />
            </div>
          )}

          {/* Blocks */}
          {blocks.map(block => {
            const topPx    = block.startMinute * PX_PER_MIN;
            const heightPx = Math.max((block.endMinute - block.startMinute) * PX_PER_MIN, 28);
            const isShort  = heightPx < 44;

            return (
              <div
                key={block.id}
                data-block="1"
                onPointerDown={e => startDrag(e, block)}
                onClick={e => {
                  e.stopPropagation();
                  setModal({ start: block.startMinute, end: block.endMinute, task: block.task, id: block.id });
                }}
                className="absolute rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                style={{
                  top:            topPx + 1,
                  height:         heightPx - 2,
                  left:           LABEL_W + 6,
                  right:          8,
                  background:     `linear-gradient(135deg, ${block.color}28 0%, ${block.color}12 100%)`,
                  border:         `1px solid ${block.color}55`,
                  borderLeft:     `3px solid ${block.color}`,
                  cursor:         'grab',
                  backdropFilter: 'blur(4px)',
                  zIndex:         20,
                }}
              >
                <div className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 20% 20%, ${block.color}18 0%, transparent 70%)` }} />
                <div className="relative h-full flex flex-col justify-center px-3 py-1.5">
                  {isShort ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate text-white" style={{ fontSize: 11 }}>{block.task}</span>
                      <span style={{ fontSize: 10, color: block.color, opacity: .9, whiteSpace: 'nowrap' }}>
                        {minsToLabel(block.startMinute)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-white truncate leading-tight" style={{ fontSize: 12 }}>{block.task}</p>
                      <p style={{ fontSize: 10, color: block.color, opacity: .85, marginTop: 2 }}>
                        {minsToLabel(block.startMinute)} – {minsToLabel(block.endMinute)}
                      </p>
                      {now && <Countdown endMin={block.endMinute} now={now} />}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <BlockModal
          initialStart={modal.start}
          initialEnd={modal.end}
          initialTask={modal.task}
          onSave={saveBlock}
          onDelete={modal.id ? () => setBlocks(p => p.filter(b => b.id !== modal.id)) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────

function NotesPanel() {
  const [notes, setNotes] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    const s = localStorage.getItem('dash-notes');
    if (s) setNotes(s);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => localStorage.setItem('dash-notes', notes), 800);
    return () => clearTimeout(t);
  }, [notes, ready]);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Notes" />
      <div className="flex-1 overflow-hidden px-3 pb-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Start writing… your notes auto-save."
          className="w-full h-full rounded-xl p-4 text-sm text-white resize-none focus:outline-none transition-colors leading-relaxed"
          style={{ background: '#40414f', border: '1px solid #3a3b44', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}

// ─── Habit Tracker ────────────────────────────────────────────────────────────

const SEED_HABITS: Habit[] = [
  { id: 'h1', name: 'Exercise',  checks: Array(7).fill(false) },
  { id: 'h2', name: 'Read',      checks: Array(7).fill(false) },
  { id: 'h3', name: 'Meditate',  checks: Array(7).fill(false) },
];

function HabitTracker() {
  const [habits,  setHabits]  = useState<Habit[]>(SEED_HABITS);
  const [newName, setNewName] = useState('');
  const [editId,  setEditId]  = useState<string | null>(null);
  const [today,   setToday]   = useState<Date | null>(null);

  useEffect(() => { setToday(new Date()); }, []);

  const weekDays  = today ? getWeekDays(today) : [];
  // Day labels: short name + date number
  const dayLabels = weekDays.map(d => ({
    short:   format(d, 'EEE'),       // Mon, Tue…
    date:    format(d, 'd'),
    isToday: today ? isSameDay(d, today) : false,
  }));

  // todayIndex = 0 (Mon) to 6 (Sun)
  const todayIdx = today ? (today.getDay() + 6) % 7 : -1;

  const toggle = (id: string, i: number) =>
    setHabits(p => p.map(h => h.id === id
      ? { ...h, checks: h.checks.map((c, j) => j === i ? !c : c) }
      : h));

  const add = () => {
    if (!newName.trim()) return;
    setHabits(p => [...p, { id: uid(), name: newName.trim(), checks: Array(7).fill(false) }]);
    setNewName('');
  };

  const rename = (id: string, name: string) =>
    setHabits(p => p.map(h => h.id === id ? { ...h, name } : h));

  const del = (id: string) => setHabits(p => p.filter(h => h.id !== id));

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Habit Tracker" />
      <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2">

        {/* Column headers: day name + date */}
        <div className="flex items-end mb-1.5 gap-2">
          <div className="flex-1 min-w-0" />
          <div className="flex gap-1 shrink-0">
            {dayLabels.map((d, i) => (
              <div key={i} className="flex flex-col items-center" style={{ width: 28 }}>
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: d.isToday ? '#60a5fa' : '#565869',
                }}>
                  {d.short}
                </span>
                <span style={{
                  fontSize: 9,
                  color: d.isToday ? '#60a5fa' : '#3f4050',
                }}>
                  {d.date}
                </span>
              </div>
            ))}
          </div>
          {/* spacer for delete button */}
          <div style={{ width: 20 }} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
          {habits.map(h => (
            <div key={h.id} className="flex items-center rounded-lg px-2.5 py-2 group gap-2" style={{ background: '#40414f' }}>
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

              {/* 7 day checkboxes */}
              <div className="flex gap-1 shrink-0">
                {h.checks.map((checked, i) => {
                  const isToday = i === todayIdx;
                  return (
                    <button
                      key={i}
                      onClick={() => toggle(h.id, i)}
                      title={weekDays[i] ? format(weekDays[i], 'EEE d MMM') : ''}
                      style={{
                        width: 28, height: 28,
                        flexShrink: 0,
                        borderRadius: 4,
                        border: checked
                          ? 'none'
                          : isToday
                            ? '2px solid rgba(96,165,250,0.6)'
                            : '1px solid #3a3b44',
                        background: checked
                          ? '#22c55e'
                          : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: checked ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseOver={e => { if (!checked) e.currentTarget.style.borderColor = '#22c55e'; }}
                      onMouseOut={e => {
                        if (!checked) e.currentTarget.style.borderColor = isToday ? 'rgba(96,165,250,0.6)' : '#3a3b44';
                      }}
                    />
                  );
                })}
              </div>

              <button onClick={() => del(h.id)}
                className="flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-all shrink-0"
                style={{ width: 20, height: 20, color: '#565869' }}
                onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
                onMouseOut={e =>  (e.currentTarget.style.color = '#565869')}>
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #3a3b44' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add a new habit…"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none border transition-colors"
            style={{ background: '#40414f', borderColor: '#3a3b44' }} />
          <button onClick={add} disabled={!newName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40 shrink-0"
            style={{ background: '#2563eb' }}
            onMouseOver={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = '#3b82f6'; }}
            onMouseOut={e =>  { e.currentTarget.style.background = '#2563eb'; }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Todo ─────────────────────────────────────────────────────────────────────

function TodoList() {
  const [todos,   setTodos]   = useState<Todo[]>([]);
  const [newTxt,  setNewTxt]  = useState('');
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editTxt, setEditTxt] = useState('');
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    setReady(true);
    try { const s = localStorage.getItem('dash-todos'); if (s) setTodos(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem('dash-todos', JSON.stringify(todos));
  }, [todos, ready]);

  const add = () => {
    if (!newTxt.trim()) return;
    setTodos(p => [...p, { id: uid(), text: newTxt.trim(), done: false }]);
    setNewTxt('');
  };
  const toggle = (id: string) => setTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del    = (id: string) => setTodos(p => p.filter(t => t.id !== id));
  const save   = (id: string) => {
    if (editTxt.trim()) setTodos(p => p.map(t => t.id === id ? { ...t, text: editTxt.trim() } : t));
    setEditId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="To-Do List" />
      <div className="flex-1 overflow-hidden flex flex-col px-3 pb-2">
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin">
          {todos.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p style={{ color: '#565869', fontSize: 13 }}>No tasks yet — add one below.</p>
            </div>
          )}
          {todos.map(t => (
            <div key={t.id}
              className={`flex items-center rounded-lg px-2.5 py-2 group gap-2 transition-opacity ${t.done ? 'opacity-60' : ''}`}
              style={{ background: '#40414f' }}>
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
                  style={t.done ? { color: '#565869' } : {}}>
                  {t.text}
                </span>
              )}
              {/* green complete toggle */}
              <button
                onClick={() => toggle(t.id)}
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  borderRadius: 4,
                  border: t.done ? 'none' : '1px solid #565869',
                  background: t.done ? '#22c55e' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: t.done ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                }}
                onMouseOver={e => { if (!t.done) e.currentTarget.style.borderColor = '#22c55e'; }}
                onMouseOut={e =>  { if (!t.done) e.currentTarget.style.borderColor = '#565869'; }}
              />
              <button onClick={() => del(t.id)}
                className="flex items-center justify-center text-lg leading-none opacity-0 group-hover:opacity-100 transition-all shrink-0"
                style={{ width: 20, height: 20, color: '#565869' }}
                onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
                onMouseOut={e =>  (e.currentTarget.style.color = '#565869')}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: '1px solid #3a3b44' }}>
          <input value={newTxt} onChange={e => setNewTxt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add a new task…"
            className="flex-1 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none border transition-colors"
            style={{ background: '#40414f', borderColor: '#3a3b44' }} />
          <button onClick={add} disabled={!newTxt.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 shrink-0 transition-colors"
            style={{ background: '#2563eb' }}
            onMouseOver={e => { if (!(e.currentTarget as HTMLButtonElement).disabled) e.currentTarget.style.background = '#3b82f6'; }}
            onMouseOut={e =>  { e.currentTarget.style.background = '#2563eb'; }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── News ─────────────────────────────────────────────────────────────────────

function NewsPanel() {
  const [bbc,    setBbc]    = useState<NewsItem[]>([]);
  const [fin,    setFin]    = useState<NewsItem[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error,  setError]  = useState(false);

  const load = useCallback(async () => {
    setLoad(true); setError(false);
    try {
      const [r1, r2] = await Promise.allSettled([
        fetch('/api/bbc-news'),
        fetch('/api/finance-news'),
      ]);
      if (r1.status === 'fulfilled' && r1.value.ok) {
        const d = await r1.value.json();
        setBbc(d.articles ?? d ?? []);
      }
      if (r2.status === 'fulfilled' && r2.value.ok) {
        const d = await r2.value.json();
        // route.ts returns items with {title, link} — normalise to {title, url}
        const items = (d.articles ?? d ?? []) as Array<{ title?: string; url?: string; link?: string }>;
        setFin(items.map(i => ({ title: i.title ?? '', url: i.url ?? i.link ?? '#' })));
      }
    } catch { setError(true); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="News" />
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-4">
        {loading ? (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 rounded animate-pulse" style={{ background: '#3a3b44', width: `${60 + (i % 5) * 7}%` }} />
                <div className="h-3 rounded animate-pulse w-2/5" style={{ background: '#3a3b44' }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center pt-10">
            <p style={{ color: '#565869', fontSize: 13 }} className="mb-3">Could not load news</p>
            <button onClick={load} style={{ color: '#60a5fa', fontSize: 13 }} className="hover:opacity-80 transition-opacity">Retry</button>
          </div>
        ) : (
          <>
            <NewsGroup title="BBC News" items={bbc}    dot="#ef4444" />
            <NewsGroup title="Finance"  items={fin}    dot="#10b981" count={12} />
          </>
        )}
      </div>
    </div>
  );
}

function NewsGroup({ title, items, dot, count = 8 }: { title: string; items: NewsItem[]; dot: string; count?: number }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
        <span className="font-semibold uppercase tracking-wider" style={{ fontSize: 11, color: '#8e8ea0' }}>{title}</span>
      </div>
      <div>
        {items.slice(0, count).map((item, i) => (
          <div key={i}>
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="block px-3 py-2 rounded-lg leading-snug transition-colors no-underline"
              style={{ fontSize: 13, color: '#ececf1' }}
              onMouseOver={e => (e.currentTarget.style.background = '#40414f')}
              onMouseOut={e =>  (e.currentTarget.style.background = 'transparent')}>
              {item.title}
            </a>
            {i < Math.min(items.length, count) - 1 && (
              <div style={{ height: 1, background: '#2e2f38', marginLeft: 12, marginRight: 12 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-3 shrink-0">
      <h2 className="font-semibold text-white tracking-tight" style={{ fontSize: 13 }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 11, color: '#565869' }}>{subtitle}</span>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin:0; padding:0; height:100%; }
        body { font-family:'Inter',system-ui,sans-serif; background:#202123; color:#ececf1; }
        .scrollbar-thin::-webkit-scrollbar { width:4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background:transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background:#3a3b44; border-radius:2px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background:#565869; }
        a { text-decoration:none; }
        [data-block] { user-select:none; }
      `}</style>

      <div className="flex flex-col h-screen overflow-hidden"
        style={{ background: '#202123', fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* Header */}
        <header className="flex items-center justify-center px-6 py-3 shrink-0"
          style={{ borderBottom: '1px solid #2e2f38', background: '#202123' }}>
          <Clock />
        </header>

        {/* Three columns */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left 25% — Time Blocking */}
          <div className="flex flex-col overflow-hidden shrink-0"
            style={{ width: '25%', borderRight: '1px solid #2e2f38' }}>
            <TimeBlockingPanel />
          </div>

          {/* Middle 50% — Todo (top) / Notes (middle) / Habits (bottom) */}
          <div className="flex flex-col overflow-hidden" style={{ width: '50%', borderRight: '1px solid #2e2f38' }}>
            <div className="overflow-hidden flex flex-col shrink-0"
              style={{ height: '30%', borderBottom: '1px solid #2e2f38' }}>
              <TodoList />
            </div>
            <div className="overflow-hidden flex flex-col shrink-0"
              style={{ height: '40%', borderBottom: '1px solid #2e2f38' }}>
              <NotesPanel />
            </div>
            <div className="overflow-hidden flex flex-col" style={{ height: '30%' }}>
              <HabitTracker />
            </div>
          </div>

          {/* Right 25% — News */}
          <div className="flex flex-col overflow-hidden shrink-0" style={{ width: '25%' }}>
            <NewsPanel />
          </div>
        </div>
      </div>
    </>
  );
}
