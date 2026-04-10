'use client';

import { useState, useEffect, useRef, useCallback, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type DragEvent as RDragEvent } from 'react';
import { format } from 'date-fns';
import { COLORS, HOURS, PX_PER_HOUR, PX_PER_MIN, LABEL_W, START_HOUR, END_HOUR } from '@/lib/constants';
import { uid, minsToLabel, formatHour, snapToFive, clamp } from '@/lib/helpers';
import { useClientNow } from '@/app/hooks/useClientNow';
import { SectionHeader } from '@/app/components/ui/SectionHeader';
import { Countdown } from '@/app/components/ui/Countdown';
import { BlockModal } from './BlockModal';
import { SuperBlockModal } from './SuperBlockModal';
import { useTodoDrag } from '@/app/components/todo-drag-context';

const SUPER_COLOR = '#a855f7';

interface TimeBlock {
  id: string;
  task: string;
  tasks: string[];
  isSuperBlock: boolean;
  startMinute: number;
  endMinute: number;
  color: string;
}

interface Props { date: string; }

export function TimeBlockingPanel({ date }: Props) {
  const now = useClientNow();
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [modal, setModal] = useState<{
    start: number; end: number; task: string; id?: string; fromDrop?: boolean;
  } | null>(null);
  const [superModal, setSuperModal] = useState<TimeBlock | null>(null);
  const [dropGhost, setDropGhost] = useState<{ startMinute: number; endMinute: number } | null>(null);
  const [isDragTarget, setIsDragTarget] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const colorIdx = useRef(0);
  const drag = useRef<{ id: string; origStart: number; origEnd: number; pointerStartY: number } | null>(null);
  const lastSnapRef = useRef(-1);
  const [mounted, setMounted] = useState(false);

  const { dragTodo } = useTodoDrag();

  const fetchBlocks = useCallback(async () => {
    if (!date) return;
    try {
      const res = await fetch(`/api/time-blocks?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          task: b.task as string,
          tasks: Array.isArray(b.tasks) ? b.tasks as string[] : [],
          isSuperBlock: Boolean(b.isSuperBlock),
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

  // ── Canvas click (existing behaviour) ──────────────────────────────────────
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

  // ── Block drag (existing pointer behaviour) ─────────────────────────────────
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

  // ── Todo drop handlers ──────────────────────────────────────────────────────
  const calcDropMinute = (clientY: number) => {
    if (!containerRef.current) return START_HOUR * 60;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollY = scrollRef.current?.scrollTop ?? 0;
    const y = clientY - rect.top + scrollY;
    const rawMin = y / PX_PER_MIN + START_HOUR * 60;
    const snapped = Math.round(rawMin / 30) * 30;
    return clamp(snapped, START_HOUR * 60, END_HOUR * 60);
  };

  const onDragOver = useCallback((e: RDragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('application/todo-json')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const start = calcDropMinute(e.clientY);
    if (start !== lastSnapRef.current) {
      lastSnapRef.current = start;
      setDropGhost({ startMinute: start, endMinute: Math.min(start + 30, 24 * 60) });
    }
    if (!isDragTarget) setIsDragTarget(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragTarget]);

  const onDragLeave = useCallback((e: RDragEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setDropGhost(null);
      setIsDragTarget(false);
      lastSnapRef.current = -1;
    }
  }, []);

  const onDrop = useCallback((e: RDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropGhost(null);
    setIsDragTarget(false);
    lastSnapRef.current = -1;
    const raw = e.dataTransfer.getData('application/todo-json');
    if (!raw) return;
    let todo: { id: string; text: string };
    try { todo = JSON.parse(raw); } catch { return; }
    const start = calcDropMinute(e.clientY);
    const end = Math.min(start + 30, 24 * 60);
    setModal({ start, end, task: todo.text, fromDrop: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save block (handles merge into super block on drop) ─────────────────────
  const saveBlock = async (task: string, start: number, end: number) => {
    if (modal?.id) {
      // Edit existing
      setBlocks(prev => prev.map(b => b.id === modal.id ? { ...b, task, startMinute: start, endMinute: end } : b));
      try {
        await fetch(`/api/time-blocks/${modal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, startMinute: start, endMinute: end }),
        });
      } catch { /* silent */ }
      return;
    }

    if (modal?.fromDrop) {
      const overlapping = blocks.filter(b => b.startMinute < end && b.endMinute > start);
      if (overlapping.length > 0) {
        const allTasks = [
          ...overlapping.flatMap(b => b.isSuperBlock && b.tasks.length > 0 ? b.tasks : [b.task]),
          task,
        ];
        const mergedStart = Math.min(start, ...overlapping.map(b => b.startMinute));
        const mergedEnd   = Math.max(end,   ...overlapping.map(b => b.endMinute));

        const overlapIds = overlapping.map(b => b.id);
        setBlocks(prev => prev.filter(b => !overlapIds.includes(b.id)));
        await Promise.all(overlapIds.map(id =>
          fetch(`/api/time-blocks/${id}`, { method: 'DELETE' }).catch(() => {}),
        ));

        const tempId = uid();
        const superBlock: TimeBlock = {
          id: tempId,
          task: allTasks.join(' · '),
          tasks: allTasks,
          isSuperBlock: true,
          startMinute: mergedStart,
          endMinute: mergedEnd,
          color: SUPER_COLOR,
        };
        setBlocks(prev => [...prev, superBlock]);
        try {
          const res = await fetch('/api/time-blocks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: superBlock.task,
              tasks: allTasks,
              isSuperBlock: true,
              startMinute: mergedStart,
              endMinute: mergedEnd,
              color: SUPER_COLOR,
              date,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            setBlocks(prev => prev.map(b => b.id === tempId ? { ...b, id: created.id } : b));
          }
        } catch { /* silent */ }
        return;
      }
    }

    // Regular new block
    const color = COLORS[colorIdx.current % COLORS.length];
    colorIdx.current++;
    const tempId = uid();
    setBlocks(prev => [...prev, { id: tempId, task, tasks: [], isSuperBlock: false, startMinute: start, endMinute: end, color }]);
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
  };

  const deleteBlock = async (id: string) => {
    setBlocks(p => p.filter(b => b.id !== id));
    try { await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' }); } catch { /* silent */ }
  };

  const updateSuperBlock = async (block: TimeBlock, newTasks: string[]) => {
    if (newTasks.length === 0) { await deleteBlock(block.id); return; }
    const isSuperBlock = newTasks.length > 1;
    const color = isSuperBlock ? SUPER_COLOR : COLORS[colorIdx.current++ % COLORS.length];
    const task = newTasks.join(' · ');
    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, task, tasks: newTasks, isSuperBlock, color } : b));
    // Also update superModal if still open
    if (superModal?.id === block.id) {
      setSuperModal(prev => prev ? { ...prev, task, tasks: newTasks, isSuperBlock, color } : null);
    }
    try {
      await fetch(`/api/time-blocks/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, tasks: newTasks, isSuperBlock, color }),
      });
    } catch { /* silent */ }
  };

  // ── Modal title ─────────────────────────────────────────────────────────────
  const modalTitle = modal?.fromDrop
    ? 'Schedule Task'
    : modal?.id
      ? `Edit: ${modal.task}`
      : 'New Time Block';

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
          style={{
            height: (END_HOUR - START_HOUR + 1) * PX_PER_HOUR,
            transition: 'background 0.25s',
            background: isDragTarget ? 'rgba(79,125,249,0.03)' : 'transparent',
          }}
          onClick={handleCanvasClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Hour grid lines */}
          {HOURS.map(h => (
            <div key={h} className="absolute left-0 right-0 flex pointer-events-none"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR, height: PX_PER_HOUR }}>
              <div className="flex items-start justify-end pt-1 pr-2 shrink-0" style={{ width: LABEL_W }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{formatHour(h)}</span>
              </div>
              <div className="flex-1 border-t" style={{ borderColor: 'var(--border-subtle)' }} />
            </div>
          ))}

          {/* Half-hour dashes */}
          {HOURS.map(h => (
            <div key={`hh-${h}`} className="absolute pointer-events-none"
              style={{ top: (h - START_HOUR) * PX_PER_HOUR + PX_PER_HOUR / 2, left: LABEL_W, right: 0, borderTop: '1px dashed var(--border-subtle)' }} />
          ))}

          <div className="absolute inset-0 cursor-pointer" style={{ left: LABEL_W, zIndex: 1 }} />

          {/* Now line */}
          {mounted && now && date === format(now, 'yyyy-MM-dd') && (
            <div className="absolute right-0 flex items-center pointer-events-none z-10"
              style={{ top: nowPx, left: LABEL_W - 4 }}>
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: 'var(--accent-red)', marginLeft: -3 }} />
              <div className="flex-1" style={{ borderTop: '2px solid var(--accent-red)' }} />
            </div>
          )}

          {/* Drop ghost */}
          {dropGhost && (
            <div
              className="absolute rounded-xl pointer-events-none drop-ghost"
              style={{
                top: (dropGhost.startMinute - START_HOUR * 60) * PX_PER_MIN + 1,
                height: (dropGhost.endMinute - dropGhost.startMinute) * PX_PER_MIN - 2,
                left: LABEL_W + 6,
                right: 8,
                zIndex: 25,
                background: 'rgba(79,125,249,0.1)',
                border: '2px dashed rgba(79,125,249,0.55)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="rgba(79,125,249,0.8)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 11, color: 'rgba(79,125,249,0.85)', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dragTodo?.text ?? 'Drop here'}
              </span>
            </div>
          )}

          {/* Blocks */}
          {blocks.map(block => {
            const topPx    = (block.startMinute - START_HOUR * 60) * PX_PER_MIN;
            const heightPx = Math.max((block.endMinute - block.startMinute) * PX_PER_MIN, 28);
            const isShort  = heightPx < 48;

            const handleBlockClick = (e: RMouseEvent) => {
              e.stopPropagation();
              if (block.isSuperBlock) {
                setSuperModal(block);
              } else {
                setModal({ start: block.startMinute, end: block.endMinute, task: block.task, id: block.id });
              }
            };

            if (block.isSuperBlock) {
              return (
                <div
                  key={block.id}
                  data-block="1"
                  onPointerDown={e => startDrag(e, block)}
                  onClick={handleBlockClick}
                  className="absolute rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
                  style={{
                    top: topPx + 1,
                    height: heightPx - 2,
                    left: LABEL_W + 6,
                    right: 8,
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.22) 0%, rgba(109,40,217,0.1) 100%)',
                    border: '1px solid rgba(168,85,247,0.38)',
                    borderLeft: '3px solid #a855f7',
                    cursor: 'grab',
                    backdropFilter: 'blur(4px)',
                    zIndex: 20,
                    boxShadow: '0 2px 16px rgba(168,85,247,0.15), inset 0 0 40px rgba(168,85,247,0.04)',
                  }}
                >
                  {/* Diagonal stripe texture */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: 'repeating-linear-gradient(-45deg, rgba(168,85,247,0.05) 0px, rgba(168,85,247,0.05) 8px, transparent 8px, transparent 18px)',
                    borderRadius: 10,
                  }} />
                  <div className="relative h-full flex flex-col justify-center px-3 py-1.5">
                    {isShort ? (
                      <div className="flex items-center gap-1.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <rect x="0.5" y="0.5" width="9" height="3" rx="1" fill="#a855f7" opacity="0.9"/>
                          <rect x="0.5" y="5"   width="9" height="3" rx="1" fill="#a855f7" opacity="0.55"/>
                        </svg>
                        <span className="font-semibold truncate text-white" style={{ fontSize: 11 }}>
                          {block.tasks.length} tasks
                        </span>
                        <span style={{ fontSize: 10, color: '#c084fc', opacity: .9, whiteSpace: 'nowrap', marginLeft: 'auto' }}>
                          {minsToLabel(block.startMinute)}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Title row */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <rect x="0.5" y="0.5"  width="11" height="3.5" rx="1.2" fill="#a855f7" opacity="0.95"/>
                            <rect x="0.5" y="5"    width="11" height="3.5" rx="1.2" fill="#a855f7" opacity="0.65"/>
                            <rect x="0.5" y="9.5"  width="11" height="2"   rx="1"   fill="#a855f7" opacity="0.3"/>
                          </svg>
                          <span className="font-bold text-white" style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Super Block
                          </span>
                          <div style={{
                            marginLeft: 'auto',
                            background: 'rgba(168,85,247,0.28)',
                            border: '1px solid rgba(168,85,247,0.45)',
                            borderRadius: 5,
                            padding: '1px 6px',
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#d8b4fe',
                          }}>
                            {block.tasks.length}
                          </div>
                        </div>
                        {/* Task list */}
                        <div className="flex flex-col gap-0.5">
                          {block.tasks.slice(0, 3).map((t, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <div style={{ width: 4, height: 4, borderRadius: 2, background: '#a855f7', flexShrink: 0 }} />
                              <span className="truncate" style={{ fontSize: 10, color: 'rgba(255,255,255,0.78)' }}>{t}</span>
                            </div>
                          ))}
                          {block.tasks.length > 3 && (
                            <span style={{ fontSize: 9, color: 'rgba(168,85,247,0.7)', marginLeft: 8 }}>
                              +{block.tasks.length - 3} more
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 10, color: '#c084fc', opacity: .85, marginTop: 4 }}>
                          {minsToLabel(block.startMinute)} – {minsToLabel(block.endMinute)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            }

            // ── Regular block ────────────────────────────────────────────────
            return (
              <div
                key={block.id}
                data-block="1"
                onPointerDown={e => startDrag(e, block)}
                onClick={handleBlockClick}
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

      {/* Block modal (new/edit/from-drop) */}
      {modal && (
        <BlockModal
          initialStart={modal.start}
          initialEnd={modal.end}
          initialTask={modal.task}
          title={modalTitle}
          onSave={saveBlock}
          onDelete={modal.id ? () => deleteBlock(modal.id!) : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {/* Super block modal */}
      {superModal && (
        <SuperBlockModal
          block={superModal}
          onUpdateTasks={newTasks => updateSuperBlock(superModal, newTasks)}
          onDelete={() => deleteBlock(superModal.id)}
          onClose={() => setSuperModal(null)}
        />
      )}
    </div>
  );
}
