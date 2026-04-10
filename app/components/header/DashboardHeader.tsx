'use client';

import { format, isYesterday, parseISO } from 'date-fns';
import { Clock } from '@/app/components/ui/Clock';
import { useTheme } from '@/app/contexts/ThemeContext';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onPrev: () => void;
  onNext: () => void;
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
      {/* Sliding knob */}
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
          /* Moon icon */
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8.5 5.8A3.8 3.8 0 014.5 1.2 3.3 3.3 0 108.5 5.8z" fill="var(--bg-dark)" />
          </svg>
        ) : (
          /* Sun icon */
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

export function DashboardHeader({ selectedDate, onPrev, onNext }: Props) {
  const isToday = selectedDate === todayStr();
  const isFuture = selectedDate >= tomorrowStr();
  const label = dateLabel(selectedDate);

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

          <div className="flex items-center gap-1.5" style={{ minWidth: 110, justifyContent: 'center' }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isToday ? 'var(--text-today)' : 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
            {isToday && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }} />
            )}
          </div>

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

      {/* Right — theme toggle + settings */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-input)')}
          onMouseOut={e => (e.currentTarget.style.background = 'var(--bg-card)')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="var(--text-secondary)" strokeWidth="1.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
              stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
