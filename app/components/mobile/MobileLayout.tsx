'use client';

import { useState, useRef } from 'react';
import { format, isYesterday, parseISO } from 'date-fns';
import { TodoList } from '@/app/components/productivity/TodoList';
import { TimeBlockingPanel } from '@/app/components/time-blocking/TimeBlockingPanel';
import { HabitTracker } from '@/app/components/productivity/HabitTracker';
import { NotesPanel } from '@/app/components/productivity/NotesPanel';
import { FinancePanel } from '@/app/components/finance/FinancePanel';
import { useTheme } from '@/app/contexts/ThemeContext';
import { DatePickerCalendar } from '@/app/components/ui/DatePickerCalendar';

type Tab = 'todo' | 'schedule' | 'habits' | 'finance';

interface Props {
  selectedDate: string;
  onPrev: () => void;
  onNext: () => void;
  onDateSelect?: (date: string) => void;
  currentUser?: { name: string; isAdmin: boolean } | null;
  onLogout?: () => void;
}

// ─── Icons ─────────────────────────────────────────────────────────────────

function TodoIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 23 23" fill="none">
      <path d="M9 6.5h8M9 11.5h8M9 16.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <rect x="3.5" y="5.5" width="3" height="3" rx="0.8" stroke="currentColor" strokeWidth={active ? '2' : '1.6'}/>
      <rect x="3.5" y="10.5" width="3" height="3" rx="0.8" stroke="currentColor" strokeWidth={active ? '2' : '1.6'}/>
      <path d="M4 16.5l1 1 2.5-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ScheduleIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 23 23" fill="none">
      <circle cx="11.5" cy="11.5" r="8" stroke="currentColor" strokeWidth={active ? '2' : '1.75'}/>
      <path d="M11.5 7.5v4.5l3 1.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HabitsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 23 23" fill="none">
      <path d="M11.5 4C11.5 4 7 7.5 7 12a4.5 4.5 0 009 0C16 7.5 11.5 4 11.5 4z" stroke="currentColor" strokeWidth={active ? '2' : '1.75'} strokeLinejoin="round"/>
      <path d="M11.5 10v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <path d="M9.5 12.5l2-2 2 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FinanceIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 23 23" fill="none">
      <path d="M3.5 17.5l5-5.5 4 3.5 6-8" stroke="currentColor" strokeWidth={active ? '2' : '1.75'} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 8.5h3.5v3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TabIcon({ id, active }: { id: Tab; active: boolean }) {
  if (id === 'todo')     return <TodoIcon active={active} />;
  if (id === 'schedule') return <ScheduleIcon active={active} />;
  if (id === 'habits')   return <HabitsIcon active={active} />;
  return <FinanceIcon active={active} />;
}

// ─── Compact theme toggle ───────────────────────────────────────────────────

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)',
        WebkitTapHighlightColor: 'transparent',
        borderRadius: 12,
      }}
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M17 10.9A7 7 0 119.1 3a5.5 5.5 0 107.9 7.9z" fill="currentColor"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="4" fill="currentColor"/>
          <path d="M10 1v2.5M10 16.5V19M1 10h2.5M16.5 10H19M3.22 3.22l1.77 1.77M15.01 15.01l1.77 1.77M3.22 16.78l1.77-1.77M15.01 4.99l1.77-1.77"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  );
}

// ─── Date label helper ──────────────────────────────────────────────────────

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

function dateLabel(dateStr: string) {
  if (dateStr === todayStr()) return 'Today';
  const d = parseISO(dateStr);
  if (isYesterday(d)) return 'Yesterday';
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
  if (dateStr === tomorrow) return 'Tomorrow';
  const thisYear = new Date().getFullYear();
  return d.getFullYear() === thisYear ? format(d, 'EEE d MMM') : format(d, 'd MMM yyyy');
}

// ─── Compact mobile header ──────────────────────────────────────────────────

function MobileHeader({ selectedDate, onPrev, onNext, onDateSelect, currentUser, onLogout }: Props) {
  const isToday = selectedDate === todayStr();
  const label = dateLabel(selectedDate);
  const [calOpen, setCalOpen] = useState(false);
  const dateRef = useRef<HTMLButtonElement>(null);

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
      paddingBottom: 6,
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: '0 1px 8px var(--shadow)',
      flexShrink: 0,
      gap: 4,
    }}>
      {/* Logo */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #4f7df9, #3b6ae8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="6" width="3" height="9" rx="1" fill="white" opacity="0.9"/>
          <rect x="6" y="3" width="3" height="12" rx="1" fill="white"/>
          <rect x="11" y="1" width="3" height="14" rx="1" fill="white" opacity="0.9"/>
        </svg>
      </div>

      {/* Date navigator — takes remaining space */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <button
          onClick={onPrev}
          style={{
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          ref={dateRef}
          onClick={() => setCalOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            minWidth: 90, justifyContent: 'center',
            background: calOpen ? 'var(--bg-input)' : 'transparent',
            border: `1px solid ${calOpen ? 'var(--border-hover)' : 'transparent'}`,
            borderRadius: 10, padding: '5px 10px', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s',
          }}
        >
          <span style={{
            fontSize: 14, fontWeight: 700,
            color: isToday ? 'var(--text-main)' : 'var(--text-secondary)',
            letterSpacing: '-0.02em',
          }}>
            {label}
          </span>
          {isToday
            ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }}/>
            : <svg width="11" height="11" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
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
            direction="down"
          />
        )}

        <button
          onClick={onNext}
          style={{
            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Right side: theme toggle + user avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <ThemeToggle />
        {currentUser && (
          <button
            onClick={onLogout}
            title={`Sign out ${currentUser.name}`}
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #4f7df9, #6366f1)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {currentUser.name[0].toUpperCase()}
          </button>
        )}
      </div>
    </header>
  );
}

// ─── Tab definitions ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'todo',     label: 'To-Do'    },
  { id: 'schedule', label: 'Schedule' },
  { id: 'habits',   label: 'Habits'   },
  { id: 'finance',  label: 'Finance'  },
];

// ─── Main layout ────────────────────────────────────────────────────────────

export function MobileLayout({ selectedDate, onPrev, onNext, onDateSelect, currentUser, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('todo');
  const [habitsSubTab, setHabitsSubTab] = useState<'habits' | 'notes'>('habits');

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    // Only swipe if horizontal movement > 55px and not primarily vertical (scroll)
    if (Math.abs(dx) > 55 && dy < 80) {
      const idx = TABS.findIndex(t => t.id === activeTab);
      if (dx < 0 && idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id);
      if (dx > 0 && idx > 0) setActiveTab(TABS[idx - 1].id);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg-dark)',
      overflow: 'hidden',
    }}>
      <MobileHeader
        selectedDate={selectedDate}
        onPrev={onPrev}
        onNext={onNext}
        onDateSelect={onDateSelect}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Panel — swipe-enabled container */}
      <div
        className="flex-1 overflow-hidden flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'todo' && <TodoList date={selectedDate} />}

        {activeTab === 'schedule' && <TimeBlockingPanel date={selectedDate} />}

        {activeTab === 'habits' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sub-tab bar */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-tabbar)',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}>
              {(['habits', 'notes'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setHabitsSubTab(t)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    borderBottom: habitsSubTab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    color: habitsSubTab === t ? 'var(--accent-blue)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                    marginBottom: -1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {t === 'habits' ? 'Habit Tracker' : 'Notes'}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {habitsSubTab === 'habits'
                ? <HabitTracker selectedDate={selectedDate} />
                : <NotesPanel date={selectedDate} />}
            </div>
          </div>
        )}

        {activeTab === 'finance' && <FinancePanel />}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-tabbar)',
        borderTop: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        flexShrink: 0,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                minHeight: 56,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                transition: 'color 0.18s',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active indicator — top bar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2.5,
                  borderRadius: '0 0 4px 4px',
                  background: 'linear-gradient(90deg, var(--accent-blue), #6b9cff)',
                  boxShadow: '0 1px 10px rgba(79,125,249,0.5)',
                }}/>
              )}
              <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.18s' }}>
                <TabIcon id={tab.id} active={isActive} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
