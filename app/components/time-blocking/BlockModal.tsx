'use client';

import { useState, useEffect, useRef } from 'react';
import { HOURS } from '@/lib/constants';
import { pad, formatHour } from '@/lib/helpers';

interface BlockModalProps {
  initialStart: number;
  initialEnd:   number;
  initialTask:  string;
  onSave:   (task: string, start: number, end: number) => void;
  onDelete?: () => void;
  onClose:  () => void;
}

export function BlockModal({ initialStart, initialEnd, initialTask, onSave, onDelete, onClose }: BlockModalProps) {
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

  const selStyle = { background: 'var(--bg-input)', borderColor: 'var(--border-main)' };
  const minOpts = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold" style={{ fontSize: 17, color: 'var(--text-main)' }}>
            {initialTask ? `Edit: ${initialTask}` : 'New Time Block'}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text-main)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Task name
            </label>
            <input
              ref={ref}
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="What are you working on?"
              className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border transition-all"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-main)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Start</label>
              <div className="flex gap-1.5">
                <select value={startH} onChange={e => setStart(+e.target.value * 60 + startM)}
                  className="flex-1 text-sm rounded-lg px-2 py-2 focus:outline-none border transition-colors"
                  style={{ ...selStyle, color: 'var(--text-main)' }}>
                  {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <select value={startM} onChange={e => setStart(startH * 60 + +e.target.value)}
                  className="w-16 text-sm rounded-lg px-2 py-2 focus:outline-none border transition-colors"
                  style={{ ...selStyle, color: 'var(--text-main)' }}>
                  {minOpts.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>End</label>
              <div className="flex gap-1.5">
                <select value={endH} onChange={e => setEnd(+e.target.value * 60 + endM)}
                  className="flex-1 text-sm rounded-lg px-2 py-2 focus:outline-none border transition-colors"
                  style={{ ...selStyle, color: 'var(--text-main)' }}>
                  {HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <select value={endM} onChange={e => setEnd(endH * 60 + +e.target.value)}
                  className="w-16 text-sm rounded-lg px-2 py-2 focus:outline-none border transition-colors"
                  style={{ ...selStyle, color: 'var(--text-main)' }}>
                  {minOpts.map(m => <option key={m} value={m}>{pad(m)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {end <= start && (
            <p style={{ color: 'var(--accent-red)', fontSize: 12 }}>End time must be after start time.</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {onDelete && (
            <button onClick={() => { onDelete(); onClose(); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--accent-red)', border: '1px solid rgba(255,71,87,0.3)', background: 'transparent', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.08)')}
              onMouseOut={e =>  (e.currentTarget.style.background = 'transparent')}>
              Delete
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
            onMouseOut={e =>  { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}>
            Cancel
          </button>
          <button onClick={save} disabled={!task.trim() || end <= start}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-blue-deep))' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
