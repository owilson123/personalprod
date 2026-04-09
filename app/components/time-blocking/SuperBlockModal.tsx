'use client';

import { useState } from 'react';
import { minsToLabel } from '@/lib/helpers';

interface SuperBlockModalProps {
  block: {
    id: string;
    tasks: string[];
    startMinute: number;
    endMinute: number;
  };
  onUpdateTasks: (newTasks: string[]) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
}

export function SuperBlockModal({ block, onUpdateTasks, onDelete, onClose }: SuperBlockModalProps) {
  const [tasks, setTasks] = useState<string[]>(block.tasks);
  const [saving, setSaving] = useState(false);

  const removeTask = async (idx: number) => {
    const next = tasks.filter((_, i) => i !== idx);
    setTasks(next);
    setSaving(true);
    await onUpdateTasks(next);
    setSaving(false);
    if (next.length === 0) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in"
        style={{
          background: '#1a1b23',
          border: '1px solid rgba(168,85,247,0.4)',
          boxShadow: '0 0 40px rgba(168,85,247,0.12)',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.15))',
                border: '1px solid rgba(168,85,247,0.45)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <rect x="2" y="2"   width="13" height="4" rx="1.5" fill="#a855f7" opacity="0.95"/>
                <rect x="2" y="7"   width="13" height="4" rx="1.5" fill="#a855f7" opacity="0.65"/>
                <rect x="2" y="12"  width="13" height="3" rx="1.5" fill="#a855f7" opacity="0.35"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white" style={{ fontSize: 16, letterSpacing: '-0.01em' }}>
                Super Block
              </h3>
              <p style={{ fontSize: 12, color: '#a855f7', marginTop: 2 }}>
                {minsToLabel(block.startMinute)} – {minsToLabel(block.endMinute)}
                <span style={{ color: '#7c3aed', margin: '0 6px' }}>·</span>
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#8b8ca0', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:text-white transition-colors"
          >×</button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(168,85,247,0.15)', marginBottom: 16 }} />

        {/* Tasks list */}
        <div className="space-y-2 mb-6">
          {tasks.map((task, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3 group transition-all"
              style={{
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.18)',
              }}
            >
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                flexShrink: 0,
                boxShadow: '0 0 6px rgba(168,85,247,0.5)',
              }} />
              <span className="flex-1 text-white text-sm truncate">{task}</span>
              <button
                onClick={() => removeTask(i)}
                disabled={saving}
                className="opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                style={{
                  color: '#52536a', fontSize: 18, lineHeight: 1,
                  cursor: 'pointer', background: 'none', border: 'none', padding: '0 2px',
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#ff4757')}
                onMouseOut={e => (e.currentTarget.style.color = '#52536a')}
              >×</button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', background: 'transparent' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,71,87,0.1)')}
            onMouseOut={e =>  (e.currentTarget.style.background = 'transparent')}
          >
            Delete Block
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
            onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={e =>  (e.currentTarget.style.opacity = '1')}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
