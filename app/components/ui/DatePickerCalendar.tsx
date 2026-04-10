'use client';

import { useState, useEffect, useRef } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addDays, isSameDay, isSameMonth,
  parseISO, isAfter,
} from 'date-fns';

interface Props {
  selectedDate: string;       // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  /** 'down' (default) drops below anchor; 'up' rises above (for mobile bottom-area use) */
  direction?: 'down' | 'up';
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function DatePickerCalendar({ selectedDate, onSelect, onClose, anchorRef, direction = 'down' }: Props) {
  const selected = parseISO(selectedDate);
  const today = new Date();
  const maxDate = addDays(today, 1); // tomorrow is the furthest forward allowed

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected));
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number }>({ top: 0, left: 0, width: 280 });
  const calRef = useRef<HTMLDivElement>(null);

  // Position relative to anchor
  useEffect(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    const calW = 280;
    let left = r.left + r.width / 2 - calW / 2;
    // Clamp inside viewport with 8px margin
    left = Math.max(8, Math.min(left, window.innerWidth - calW - 8));

    if (direction === 'up') {
      setPos({ bottom: window.innerHeight - r.top + 8, left, width: calW });
    } else {
      setPos({ top: r.bottom + 8, left, width: calW });
    }
    // Animate in
    requestAnimationFrame(() => setVisible(true));
  }, [anchorRef, direction]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: Event) => {
      if (calRef.current && !calRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler, true);
    document.addEventListener('touchstart', handler, true);
    return () => {
      document.removeEventListener('mousedown', handler, true);
      document.removeEventListener('touchstart', handler, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 160);
  };

  const handleSelect = (d: Date) => {
    if (isAfter(d, maxDate)) return;
    onSelect(format(d, 'yyyy-MM-dd'));
    handleClose();
  };

  // Build the 6-row grid (Mon-start)
  const monthStart = startOfMonth(viewMonth);
  const monthEnd   = endOfMonth(viewMonth);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 });

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const canGoBack = true; // allow navigating to past months
  const canGoForward = isSameMonth(viewMonth, today) || !isAfter(startOfMonth(addMonths(viewMonth, 1)), startOfMonth(addMonths(today, 1)));

  return (
    <div
      ref={calRef}
      style={{
        position: 'fixed',
        zIndex: 1000,
        width: pos.width,
        ...(pos.top !== undefined ? { top: pos.top } : {}),
        ...(pos.bottom !== undefined ? { bottom: pos.bottom } : {}),
        left: pos.left,
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'scale(1) translateY(0)'
          : direction === 'up' ? 'scale(0.95) translateY(6px)' : 'scale(0.95) translateY(-6px)',
        transition: 'opacity 0.16s ease, transform 0.16s cubic-bezier(0.34,1.56,0.64,1)',
        transformOrigin: direction === 'up' ? 'bottom center' : 'top center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-main)',
        borderRadius: 16,
        boxShadow: '0 8px 40px var(--shadow), 0 2px 8px rgba(0,0,0,0.12)',
        padding: '14px 12px 12px',
        userSelect: 'none',
      }}
    >
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 2, paddingRight: 2 }}>
        <button
          onClick={() => canGoBack && setViewMonth(m => subMonths(m, 1))}
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: canGoBack ? 'var(--bg-input)' : 'transparent',
            color: canGoBack ? 'var(--text-secondary)' : 'var(--border-main)',
            cursor: canGoBack ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseEnter={e => { if (canGoBack) e.currentTarget.style.background = 'var(--bg-input)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = canGoBack ? 'var(--bg-input)' : 'transparent'; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          onClick={() => onSelect(format(today, 'yyyy-MM-dd'))}
          style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-main)',
            background: 'none', border: 'none', cursor: 'pointer',
            letterSpacing: '-0.02em', padding: '2px 8px', borderRadius: 6,
            transition: 'background 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}
          title="Jump to today"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-input)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          {format(viewMonth, 'MMMM yyyy')}
        </button>

        <button
          onClick={() => canGoForward && setViewMonth(m => addMonths(m, 1))}
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: canGoForward ? 'var(--bg-input)' : 'transparent',
            color: canGoForward ? 'var(--text-secondary)' : 'var(--border-main)',
            cursor: canGoForward ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 600,
            color: 'var(--text-muted)', letterSpacing: '0.04em',
            paddingBottom: 4,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((d, i) => {
          const inMonth   = isSameMonth(d, viewMonth);
          const isToday   = isSameDay(d, today);
          const isSelected = isSameDay(d, selected);
          const isFuture  = isAfter(d, maxDate);
          const isDisabled = isFuture;

          return (
            <button
              key={i}
              onClick={() => !isDisabled && handleSelect(d)}
              style={{
                height: 32,
                borderRadius: 8,
                border: isSelected ? '2px solid var(--accent-blue)' : isToday ? '1.5px solid var(--accent-blue)' : '1.5px solid transparent',
                background: isSelected
                  ? 'var(--accent-blue)'
                  : isToday
                    ? 'rgba(79,125,249,0.1)'
                    : 'transparent',
                color: isSelected
                  ? '#fff'
                  : isDisabled
                    ? 'var(--border-main)'
                    : !inMonth
                      ? 'var(--text-muted)'
                      : isToday
                        ? 'var(--accent-blue)'
                        : 'var(--text-main)',
                fontSize: 12,
                fontWeight: isSelected || isToday ? 700 : 400,
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'background 0.12s, border-color 0.12s, transform 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.background = 'var(--bg-input)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = isToday ? 'rgba(79,125,249,0.1)' : 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      {!isSameDay(selected, today) && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => { onSelect(format(today, 'yyyy-MM-dd')); handleClose(); }}
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--accent-blue)',
              background: 'rgba(79,125,249,0.08)', border: '1px solid rgba(79,125,249,0.2)',
              borderRadius: 8, padding: '4px 14px', cursor: 'pointer',
              transition: 'background 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,125,249,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,125,249,0.08)'; }}
          >
            Jump to Today
          </button>
        </div>
      )}
    </div>
  );
}
