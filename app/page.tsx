'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { format, addDays, subDays, parseISO, isToday } from 'date-fns';
import { DashboardHeader } from '@/app/components/header/DashboardHeader';
import { TimeBlockingPanel } from '@/app/components/time-blocking/TimeBlockingPanel';
import { TodoList } from '@/app/components/productivity/TodoList';
import { NotesPanel } from '@/app/components/productivity/NotesPanel';
import { HabitTracker } from '@/app/components/productivity/HabitTracker';
import { FinancePanel } from '@/app/components/finance/FinancePanel';

const MIN_COL = 10; // percent
const MAX_COL = 60;
const MIN_ROW = 10;

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Run one-time schema migration on first load
  useEffect(() => {
    fetch('/api/setup', { method: 'POST' }).catch(() => {});
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedDate(d => format(subDays(parseISO(d), 1), 'yyyy-MM-dd'));
  }, []);

  const goToNext = useCallback(() => {
    setSelectedDate(d => {
      const next = format(addDays(parseISO(d), 1), 'yyyy-MM-dd');
      const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      return next <= tomorrowStr ? next : d;
    });
  }, []);

  const [leftWidth,   setLeftWidth]   = useState(25);
  const [rightWidth,  setRightWidth]  = useState(25);
  const [todoHeight,  setTodoHeight]  = useState(30);
  const [bottomTab,   setBottomTab]   = useState<'habits' | 'notes'>('habits');

  const containerRef  = useRef<HTMLDivElement>(null);
  const middleColRef  = useRef<HTMLDivElement>(null);

  const onLeftDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startLeft = leftWidth;
    const totalW = containerRef.current?.getBoundingClientRect().width ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / totalW) * 100;
      setLeftWidth(Math.max(MIN_COL, Math.min(MAX_COL, startLeft + delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  const onRightDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startRight = rightWidth;
    const totalW = containerRef.current?.getBoundingClientRect().width ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / totalW) * 100;
      setRightWidth(Math.max(MIN_COL, Math.min(MAX_COL, startRight - delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [rightWidth]);

  const onTodoDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY, startTodo = todoHeight;
    const totalH = middleColRef.current?.getBoundingClientRect().height ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientY - startY) / totalH) * 100;
      setTodoHeight(Math.max(MIN_ROW, Math.min(100 - MIN_ROW, startTodo + delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [todoHeight]);

  const bottomHeight = 100 - todoHeight;

  const divider = (onDown: (e: React.MouseEvent) => void, axis: 'col' | 'row') => ({
    style: {
      [axis === 'col' ? 'width' : 'height']: '4px',
      background: '#1e1f2a', cursor: `${axis}-resize`, flexShrink: 0 as const,
      transition: 'background 0.15s',
    } as React.CSSProperties,
    onMouseDown: onDown,
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#3a3b52'),
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = '#1e1f2a'),
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      <DashboardHeader
        selectedDate={selectedDate}
        onPrev={goToPrev}
        onNext={goToNext}
      />

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* Left — Time Blocking */}
        <div className="flex flex-col overflow-hidden shrink-0" style={{ width: `${leftWidth}%` }}>
          <TimeBlockingPanel date={selectedDate} />
        </div>

        <div {...divider(onLeftDividerDown, 'col')} />

        {/* Middle — Todo / Habits+Notes */}
        <div className="flex flex-col overflow-hidden flex-1" ref={middleColRef}>
          <div className="overflow-hidden flex flex-col shrink-0" style={{ height: `${todoHeight}%` }}>
            <TodoList date={selectedDate} />
          </div>

          <div {...divider(onTodoDividerDown, 'row')} />

          {/* Tabbed bottom: Habits (default) + Notes */}
          <div className="overflow-hidden flex flex-col" style={{ height: `${bottomHeight}%` }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', background: '#13141c', borderBottom: '1px solid #1e1f2a', flexShrink: 0 }}>
              {(['habits', 'notes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBottomTab(tab)}
                  style={{
                    padding: '7px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    borderBottom: bottomTab === tab ? '2px solid #4f7df9' : '2px solid transparent',
                    color: bottomTab === tab ? '#4f7df9' : '#555770',
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                    marginBottom: '-1px',
                  }}
                >
                  {tab === 'habits' ? 'Habit Tracker' : 'Notes'}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {bottomTab === 'habits'
                ? <HabitTracker selectedDate={selectedDate} />
                : <NotesPanel date={selectedDate} />
              }
            </div>
          </div>
        </div>

        <div {...divider(onRightDividerDown, 'col')} />

        {/* Right — Finance Panel */}
        <div className="flex flex-col overflow-hidden shrink-0" style={{ width: `${rightWidth}%` }}>
          <FinancePanel />
        </div>
      </div>
    </div>
  );
}
