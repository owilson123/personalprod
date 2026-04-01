'use client';

import { format, isYesterday, isToday as fnsIsToday, parseISO } from 'date-fns';
import { Clock } from '@/app/components/ui/Clock';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onPrev: () => void;
  onNext: () => void;
}

function dateLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (fnsIsToday(d)) return 'Today';
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

export function DashboardHeader({ selectedDate, onPrev, onNext }: Props) {
  const isToday = fnsIsToday(parseISO(selectedDate));
  const label = dateLabel(selectedDate);

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: 7,
    border: '1px solid #2a2b3d',
    background: 'transparent',
    cursor: 'pointer',
    color: '#52536a',
    transition: 'all 0.15s',
    flexShrink: 0,
  };

  return (
    <header className="flex items-center justify-between px-6 py-2.5 shrink-0"
      style={{
        background: 'linear-gradient(180deg, #12131a 0%, #0f1117 100%)',
        borderBottom: '1px solid #1e1f2a',
        boxShadow: '0 1px 12px rgba(0,0,0,0.3)',
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
          background: 'linear-gradient(135deg, #f0f0f5, #8b8ca0)',
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
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3b52'; e.currentTarget.style.color = '#c8c8d4'; e.currentTarget.style.background = '#1a1b23'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2b3d'; e.currentTarget.style.color = '#52536a'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Chevron dir="left" />
          </button>

          <div className="flex items-center gap-1.5" style={{ minWidth: 110, justifyContent: 'center' }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isToday ? '#e8e8f0' : '#a0a0b8',
              letterSpacing: '-0.01em',
            }}>
              {label}
            </span>
            {isToday && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f7df9', flexShrink: 0 }} />
            )}
          </div>

          <button
            style={{ ...btnBase, opacity: isToday ? 0.3 : 1, cursor: isToday ? 'default' : 'pointer' }}
            onClick={isToday ? undefined : onNext}
            onMouseEnter={e => { if (!isToday) { e.currentTarget.style.borderColor = '#3a3b52'; e.currentTarget.style.color = '#c8c8d4'; e.currentTarget.style.background = '#1a1b23'; } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2b3d'; e.currentTarget.style.color = '#52536a'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Chevron dir="right" />
          </button>
        </div>

        <Clock />
      </div>

      {/* Right — settings */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
          style={{ background: '#1a1b23' }}
          onMouseOver={e => (e.currentTarget.style.background = '#242530')}
          onMouseOut={e => (e.currentTarget.style.background = '#1a1b23')}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="#8b8ca0" strokeWidth="1.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
              stroke="#8b8ca0" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
