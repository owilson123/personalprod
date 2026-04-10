'use client';

import { useState, useRef } from 'react';
import { format, isYesterday, parseISO } from 'date-fns';
import { Clock } from '@/app/components/ui/Clock';
import { useTheme } from '@/app/contexts/ThemeContext';
import { DatePickerCalendar } from '@/app/components/ui/DatePickerCalendar';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onPrev: () => void;
  onNext: () => void;
  onDateSelect?: (date: string) => void;
  currentUser?: { name: string; isAdmin: boolean } | null;
  onLogout?: () => void;
}

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
const tomorrowStr = () => format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

function dateLabel(dateStr: string) {
  if (dateStr === todayStr()) return 'Today';
  if (dateStr === tomorrowStr()) return 'Tomorrow';
  const d = parseISO(dateStr);
  if (isYesterday(d)) return 'Yesterday';
  const thisYear = new Date().getFullYear();
  return d.getFullYear() === thisYear
    ? format(d, 'EEE, MMM d')
    : format(d, 'EEE, MMM d yyyy');
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {dir === 'left'
        ? <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M5 3l4 4-4 4"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  );
}

function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: isDark ? 'var(--bg-input)' : '#dce3fa',
        border: `1px solid ${isDark ? 'var(--border-main)' : '#b8c4ee'}`,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.3s, border-color 0.3s',
        padding: 0,
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: isDark ? 3 : 21,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: isDark ? 'var(--text-secondary)' : '#f5a623',
          transition: 'left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.28s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 4px rgba(245,166,35,0.5)',
        }}
      >
        {isDark ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8.5 5.8A3.8 3.8 0 014.5 1.2 3.3 3.3 0 108.5 5.8z" fill="var(--bg-dark)" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="2" fill="#1a1c2e" />
            <path d="M5 1v1.2M5 7.8V9M1 5h1.2M7.8 5H9M2.5 2.5l.9.9M6.6 6.6l.9.9M2.5 7.5l.9-.9M6.6 3.4l.9-.9"
              stroke="#1a1c2e" strokeWidth="1" strokeLinecap="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

export function DashboardHeader({ selectedDate, onPrev, onNext, onDateSelect, currentUser, onLogout }: Props) {
  const isToday = selectedDate === todayStr();
  const isFuture = selectedDate >= tomorrowStr();
  const label = dateLabel(selectedDate);
  const [calOpen, setCalOpen] = useState(false);
  const dateRef = useRef<HTMLButtonElement>(null);

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 7,
    border: '1px solid var(--border-main)',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    transition: 'all 0.15s',
    flexShrink: 0,
  };

  return (
    <header className="flex items-center justify-between px-6 py-2.5 shrink-0"
      style={{
        background: 'linear-gradient(180deg, var(--bg-header) 0%, var(--bg-dark) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 12px var(--shadow)',
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}>

      {/* Left — logo + title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #4f7df9, #3b6ae8)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="6" width="3" height="9" rx="1" fill="white" opacity="0.9" />
            <rect x="6" y="3" width="3" height="12" rx="1" fill="white" />
            <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.9" />
          </svg>
        </div>
        <h1 className="font-bold tracking-tight" style={{
          fontSize: 17,
          background: 'linear-gradient(135deg, var(--text-main), var(--text-secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Command Center
        </h1>
      </div>

      {/* Centre — date navigator + clock */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-2.5">
          <button
            style={btnBase}
            onClick={onPrev}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-hover)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Chevron dir="left" />
          </button>

          <button
            ref={dateRef}
            onClick={() => setCalOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              minWidth: 110, justifyContent: 'center',
              background: calOpen ? 'var(--bg-input)' : 'transparent',
              border: `1px solid ${calOpen ? 'var(--border-hover)' : 'transparent'}`,
              borderRadius: 8, padding: '3px 8px', cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => { if (!calOpen) { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'var(--border-main)'; }}}
            onMouseLeave={e => { if (!calOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}}
          >
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isToday ? 'var(--text-today)' : 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
            {isToday
              ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }} />
              : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <path d="M1 3h8M3 1v2M7 1v2M1.5 4h7a.5.5 0 01.5.5v4a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5v-4a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
            }
          </button>
          {calOpen && onDateSelect && (
            <DatePickerCalendar
              selectedDate={selectedDate}
              onSelect={onDateSelect}
              onClose={() => setCalOpen(false)}
              anchorRef={dateRef}
            />
          )}

          <button
            style={{ ...btnBase, opacity: isFuture ? 0.3 : 1, cursor: isFuture ? 'default' : 'pointer' }}
            onClick={isFuture ? undefined : onNext}
            onMouseEnter={e => { if (!isFuture) { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-hover)'; e.currentTarget.style.background = 'var(--bg-card)'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Chevron dir="right" />
          </button>
        </div>

        <Clock />
      </div>

      {/* Right — theme toggle + user info + logout */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {currentUser && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 10px 4px 6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: '8px',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f7df9, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {currentUser.name[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-hover)' }}>
                {currentUser.name}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid var(--border-main)',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-red)'; e.currentTarget.style.color = 'var(--accent-red)'; e.currentTarget.style.background = 'rgba(255,71,87,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
