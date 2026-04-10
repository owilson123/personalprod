'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

interface Props { date: string; } // YYYY-MM-DD

export function NotesPanel({ date }: Props) {
  const [notes, setNotes] = useState('');
  const [ready, setReady] = useState(false);
  const [useLocal, setUseLocal] = useState(false);

  const localKey = `dash-notes-${date}`;
  const today = format(new Date(), 'yyyy-MM-dd');
  const isPast = date < today;

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes?date=${date}`);
      if (res.status === 503) { setUseLocal(true); return null; }
      if (res.ok) return await res.json();
    } catch { setUseLocal(true); }
    return null;
  }, [date]);

  useEffect(() => {
    setReady(false);
    setNotes('');
    fetchNotes().then(data => {
      setReady(true);
      if (data && data.content) {
        setNotes(data.content);
      } else if (data && !data.content) {
        try {
          const s = localStorage.getItem(localKey);
          if (s) {
            setNotes(s);
            fetch('/api/notes', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: s, date }),
            }).then(() => localStorage.removeItem(localKey));
          }
        } catch { /* silent */ }
      } else {
        try {
          const s = localStorage.getItem(localKey);
          if (s) setNotes(s);
        } catch { /* silent */ }
      }
    });
  }, [date, fetchNotes, localKey]);

  // Debounced save
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (useLocal) {
        localStorage.setItem(localKey, notes);
      } else {
        fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: notes, date }),
        }).catch(() => localStorage.setItem(localKey, notes));
      }
    }, 800);
    return () => clearTimeout(t);
  }, [notes, ready, useLocal, localKey, date]);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Notes" />
      <div className="flex-1 overflow-hidden px-3 pb-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          readOnly={isPast}
          placeholder={isPast ? 'No notes for this day.' : 'Start writing… your notes auto-save.'}
          className="w-full h-full rounded-xl p-4 text-sm resize-none focus:outline-none transition-all leading-relaxed"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            color: 'var(--text-main)',
            fontFamily: 'inherit',
            opacity: isPast && !notes ? 0.5 : 1,
            cursor: isPast ? 'default' : 'text',
          }}
        />
      </div>
    </div>
  );
}
