'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

export function NotesPanel() {
  const [notes, setNotes] = useState('');
  const [ready, setReady] = useState(false);
  const [useLocal, setUseLocal] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.status === 503) { setUseLocal(true); return null; }
      if (res.ok) return await res.json();
    } catch { setUseLocal(true); }
    return null;
  }, []);

  useEffect(() => {
    setReady(true);
    fetchNotes().then(data => {
      if (data && data.content) {
        setNotes(data.content);
      } else if (data && !data.content) {
        // DB available but empty — check localStorage for migration
        const s = localStorage.getItem('dash-notes');
        if (s) {
          setNotes(s);
          fetch('/api/notes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: s }),
          }).then(() => localStorage.removeItem('dash-notes'));
        }
      } else {
        const s = localStorage.getItem('dash-notes');
        if (s) setNotes(s);
      }
    });
  }, [fetchNotes]);

  // Debounced save
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      if (useLocal) {
        localStorage.setItem('dash-notes', notes);
      } else {
        fetch('/api/notes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: notes }),
        }).catch(() => localStorage.setItem('dash-notes', notes));
      }
    }, 800);
    return () => clearTimeout(t);
  }, [notes, ready, useLocal]);

  return (
    <div className="flex flex-col h-full">
      <SectionHeader title="Notes" />
      <div className="flex-1 overflow-hidden px-3 pb-3">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Start writing… your notes auto-save."
          className="w-full h-full rounded-xl p-4 text-sm text-white resize-none focus:outline-none transition-all leading-relaxed"
          style={{ background: '#1a1b23', border: '1px solid #2a2b3d', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}
