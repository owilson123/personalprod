'use client';

import { useState, useEffect, useRef } from 'react';
import { HOURS } from '@/lib/constants';
import { pad, formatHour } from '@/lib/helpers';

interface BlockModalProps {
  initialStart: number;
  initialEnd:   number;
  initialTask:  string;
  title?:       string;
  onSave:   (task: string, start: number, end: number) => void;
  onDelete?: () => void;
  onClose:  () => void;
}

export function BlockModal({ initialStart, initialEnd, initialTask, title, onSave, onDelete, onClose }: BlockModalProps) {
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
  const selStyle = { background: '#242530', borderColor: '#2a2b3d' };
  const minOpts = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const heading = title ?? (initialTask ? `Edit: ${initialTask}` : 'New Time Block');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
        style={{ background: '#1a1b23', border: '1px solid #2a2b3d' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white" style={{ fontSize: 17 }}>
            {heading}
          </h3>
          <button onClick={onClose} style={{ color: '#8b8ca0', fontSize: 22, lineHeight: 1 }}
            className="hover:text-white transition-colors">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8b8ca0' }}>
              Task name
            </label>
            <input
              ref={ref}
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="What are you working on?"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none border transition-all"
              style={{ background: '#242530', borderColor: '#2a2b3d' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8b8ca0' }}>Start</label>
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
              <label className="block text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: '#8b8ca0' }}>End</label>
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
            <p style={{ color: '#ff4757', fontSize: 12 }}>End time must be after start time.</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {onDelete && (
            <button onClick={() => { onDelete(); onClose(); }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.1)')}
              onMouseOut={e =>  (e.currentTarget.style.background = 'transparent')}>
              Delete
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#8b8ca0' }}
            onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#242530'; }}
            onMouseOut={e =>  { e.currentTarget.style.color = '#8b8ca0'; e.currentTarget.style.background = 'transparent'; }}>
            Cancel
          </button>
          <button onClick={save} disabled={!task.trim() || end <= start}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #4f7df9, #3b6ae8)' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
