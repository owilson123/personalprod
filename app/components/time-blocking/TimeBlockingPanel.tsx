'use client';

import { useState, useEffect, useRef, useCallback, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent } from 'react';
import { format } from 'date-fns';
import { COLORS, HOURS, PX_PER_HOUR, PX_PER_MIN, LABEL_W, START_HOUR, END_HOUR } from '@/lib/constants';
import { uid, minsToLabel, formatHour, snapToFive, clamp } from '@/lib/helpers';
import { useClientNow } from '@/app/hooks/useClientNow';
import { SectionHeader } from '@/app/components/ui/SectionHeader';
import { Countdown } from '@/app/components/ui/Countdown';
import { BlockModal } from './BlockModal';

interface TimeBlock {
  id: string;
  task: string;
  startMinute: number;
  endMinute: number;
  color: string;
}

interface Props { date: string; } // YYYY-MM-DD

export function TimeBlockingPanel({ date }: Props) {
  const now = useClientNow();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [modal, setModal] = useState<{ start: number; end: number; task: string; id?: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const colorIdx = useRef(0);
  const drag = useRef<{ id: string; origStart: number; origEnd: number; pointerStartY: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchBlocks = useCallback(async () => {
    if (!date) return;
    try {
      const res = await fetch(`/api/time-blocks?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          task: b.task as string,
          startMinute: b.startMinute as number,
          endMinute: b.endMinute as number,
          color: b.color as string,
        })));
      }
    } catch { /* fallback to empty */ }
  }, [date]);

  useEffect(() => {
    setMounted(true);
    setBlocks([]);
    fetchBlocks();
  }, [fetchBlocks]);

  const nowPx = now ? (now.getHours() * 60 + now.getMinutes() - START_HOUR * 60) * PX_PER_MIN : -999;

  const handleCanvasClick = (e: RMouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if ((e.target as HTMLElement).closest('[data-block]')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawMin = y / PX_PER_MIN + START_HOUR * 60;
    const snap = Math.floor(rawMin / 30) * 30;
    const start = clamp(snap, START_HOUR * 60, END_HOUR * 60);
    const end = clamp(start + 30, START_HOUR * 60 + 30, (END_HOUR + 1) * 60);
    setModal({ start, end, task: '' });
  };

  const startDrag = (e: RPointerEvent<HTMLDivElement>, block: TimeBlock) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id: block.id, origStart: block.startMinute, origEnd: block.endMinute, pointerStartY: e.clientY };
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const d = drag.current;
    const deltaMin = snapToFive((e.clientY - d.pointerStartY) / PX_PER_MIN);
    const dur = d.origEnd - d.origStart;
    const ns = clamp(d.origStart + deltaMin, 0, 24 * 60 - dur);
    setBlocks(prev => prev.map(b => b.id === d.id ? { ...b, startMinute: ns, endMinute: ns + dur } : b));
  };

  const onPointerUp = async (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const blockId = drag.current.id;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    drag.current = null;
    // persist drag position
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      try {
        await fetch(`/api/time-blocks/${blockId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startMinute: block.startMinute, endMinute: block.endMinute }),
        });
      } catch { /* silent */ }
    }
  };

  const saveBlock = async (task: string, start: number, end: number) => {
    if (modal?.id) {
      setBlocks(prev => prev.map(b => b.id === modal.id ? { ...b, task, startMinute: start, endMinute: end } : b));
      try {
        await fetch(`/api/time-blocks/${modal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, startMinute: start, endMinute: end }),
        });
      } catch { /* silent */ }
    } else {
      const color = COLORS[colorIdx.current % COLORS.length];
      colorIdx.current++;
      const tempId = uid();
      setBlocks(prev => [...prev, { id: tempId, task, startMinute: start, endMinute: end, color }]);
      try {
        const res = await fetch('/api/time-blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, startMinute: start, endMinute: end, color, date }),
        });
        if (res.ok) {
          const created = await res.json();
          setBlocks(prev => prev.map(b => b.id === tempId ? { ...b, id: created.id } : b));
        }
      } catch { /* silent */ }
    }
  };

  const deleteBlock = async (id: string) => {
    setBlocks(p => p.filter(b => b.id !== id));
    try {
      await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' });
    } catch { /* silent */ }
  };

  return (
    <div className="flex flex-col h-full select-none">
      <SectionHeader title="Time Blocking" subtitle={mounted ? date : ''} />

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
          style={{ height: (END_HOUR - START_HOUR + 1) * PX_PER_HOUR }}
          onClick={handleCanvasClick}
        >
          {HOURS.map(h => (
            <div key={h} className="absolute left-0 right-0 flex pointer-events-none"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR, height: PX_PER_HOUR }}>
              <div className="flex items-start justify-end pt-1 pr-2 shrink-0" style={{ width: LABEL_W }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{formatHour(h)}</span>
              </div>
              <div className="flex-1 border-t" style={{ borderColor: 'var(--border-subtle)' }} />
            </div>
          ))}

          {HOURS.map(h => (
            <div key={`hh-${h}`} className="absolute pointer-events-none"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2, left: LABEL_W, right: 0, borderTop: '1px dashed var(--border-subtle)' }} />
          ))}

          <div className="absolute inset-0 cursor-pointer" style={{ left: LABEL_W, zIndex: 1 }} />

          {mounted && now && date === format(now, 'yyyy-MM-dd') && (
            <div className="absolute right-0 flex items-center pointer-events-none z-10"
              style={{ top: nowPx, left: LABEL_W - 4 }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--accent-red)', marginLeft: -3 }} />
              <div className="flex-1" style={{ borderTop: '2px solid var(--accent-red)' }} />
            </div>
          )}

          {blocks.map(block => {
            const topPx = (block.startMinute - START_HOUR * 60) * PX_PER_MIN;
            const heightPx = Math.max((block.endMinute - block.startMinute) * PX_PER_MIN, 28);
            const isShort = heightPx < 44;

            return (
              <div
                key={block.id}
                data-block="1"
                onPointerDown={e => startDrag(e, block)}
                onClick={e => {
                  e.stopPropagation();
                  setModal({ start: block.startMinute, end: block.endMinute, task: block.task, id: block.id });
                }}
                className="absolute rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
                style={{
                  top: topPx + 1,
                  height: heightPx - 2,
                  left: LABEL_W + 6,
                  right: 8,
                  background: `linear-gradient(135deg, ${block.color}28 0%, ${block.color}12 100%)`,
                  border: `1px solid ${block.color}55`,
                  borderLeft: `3px solid ${block.color}`,
                  cursor: 'grab',
                  backdropFilter: 'blur(4px)',
                  zIndex: 20,
                }}
              >
                <div className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 20% 20%, ${block.color}18 0%, transparent 70%)` }} />
                <div className="relative h-full flex flex-col justify-center px-3 py-1.5">
                  {isShort ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate" style={{ fontSize: 11, color: 'var(--text-main)' }}>{block.task}</span>
                      <span style={{ fontSize: 10, color: block.color, opacity: .9, whiteSpace: 'nowrap' }}>
                        {minsToLabel(block.startMinute)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold truncate leading-tight" style={{ fontSize: 12, color: 'var(--text-main)' }}>{block.task}</p>
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
          onDelete={modal.id ? () => deleteBlock(modal.id!) : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
