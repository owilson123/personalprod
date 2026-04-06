'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/app/components/header/DashboardHeader';
import { TodoList } from '@/app/components/productivity/TodoList';
import { TimeBlockingPanel } from '@/app/components/time-blocking/TimeBlockingPanel';
import { HabitTracker } from '@/app/components/productivity/HabitTracker';
import { NotesPanel } from '@/app/components/productivity/NotesPanel';
import { FinancePanel } from '@/app/components/finance/FinancePanel';

type Tab = 'todo' | 'schedule' | 'habits' | 'finance';

interface Props {
  selectedDate: string;
  onPrev: () => void;
  onNext: () => void;
}

function TodoIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none">
      <path d="M9 6.5h8M9 11.5h8M9 16.5h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <rect x="3.5" y="5.5" width="3" height="3" rx="0.8" stroke="currentColor" strokeWidth={active ? '2' : '1.6'}/>
      <rect x="3.5" y="10.5" width="3" height="3" rx="0.8" stroke="currentColor" strokeWidth={active ? '2' : '1.6'}/>
      <path d="M4 16.5l1 1 2.5-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ScheduleIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none">
      <circle cx="11.5" cy="11.5" r="8" stroke="currentColor" strokeWidth={active ? '2' : '1.75'}/>
      <path d="M11.5 7.5v4.5l3 1.8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HabitsIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none">
      <path d="M11.5 4C11.5 4 7 7.5 7 12a4.5 4.5 0 009 0C16 7.5 11.5 4 11.5 4z" stroke="currentColor" strokeWidth={active ? '2' : '1.75'} strokeLinejoin="round"/>
      <path d="M11.5 10v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <path d="M9.5 12.5l2-2 2 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FinanceIcon({ active }: { active: boolean }) {
  return (
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none">
      <path d="M3.5 17.5l5-5.5 4 3.5 6-8" stroke="currentColor" strokeWidth={active ? '2' : '1.75'} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 8.5h3.5v3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'todo',     label: 'To-Do'    },
  { id: 'schedule', label: 'Schedule' },
  { id: 'habits',   label: 'Habits'   },
  { id: 'finance',  label: 'Finance'  },
];

function TabIcon({ id, active }: { id: Tab; active: boolean }) {
  if (id === 'todo')     return <TodoIcon active={active} />;
  if (id === 'schedule') return <ScheduleIcon active={active} />;
  if (id === 'habits')   return <HabitsIcon active={active} />;
  return <FinanceIcon active={active} />;
}

export function MobileLayout({ selectedDate, onPrev, onNext }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('todo');
  const [habitsSubTab, setHabitsSubTab] = useState<'habits' | 'notes'>('habits');

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      <DashboardHeader selectedDate={selectedDate} onPrev={onPrev} onNext={onNext} />

      {/* Panel */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'todo'     && <TodoList date={selectedDate} />}
        {activeTab === 'schedule' && <TimeBlockingPanel date={selectedDate} />}
        {activeTab === 'habits'   && (
          <div className="flex flex-col h-full">
            {/* Sub-tab bar */}
            <div style={{ display: 'flex', background: '#13141c', borderBottom: '1px solid #1e1f2a', flexShrink: 0 }}>
              {(['habits', 'notes'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setHabitsSubTab(t)}
                  style={{
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    borderBottom: habitsSubTab === t ? '2px solid #4f7df9' : '2px solid transparent',
                    color: habitsSubTab === t ? '#4f7df9' : '#555770',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                    marginBottom: '-1px',
                  }}
                >
                  {t === 'habits' ? 'Habit Tracker' : 'Notes'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {habitsSubTab === 'habits'
                ? <HabitTracker selectedDate={selectedDate} />
                : <NotesPanel date={selectedDate} />}
            </div>
          </div>
        )}
        {activeTab === 'finance'  && <FinancePanel />}
      </div>

      {/* Bottom tab bar */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(13,14,20,0.96)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          flexShrink: 0,
        }}
      >
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
                padding: '10px 0 9px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#4f7df9' : '#444560',
                transition: 'color 0.18s',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Active top bar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28,
                  height: 2.5,
                  borderRadius: '0 0 4px 4px',
                  background: 'linear-gradient(90deg, #4f7df9, #6b9cff)',
                  boxShadow: '0 1px 10px rgba(79,125,249,0.55)',
                }} />
              )}
              <div style={{
                transition: 'transform 0.18s',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
              }}>
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
