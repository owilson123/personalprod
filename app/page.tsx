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
  const [notesHeight, setNotesHeight] = useState(40);

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
      setTodoHeight(Math.max(MIN_ROW, Math.min(100 - notesHeight - MIN_ROW, startTodo + delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [todoHeight, notesHeight]);

  const onNotesDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY, startNotes = notesHeight;
    const totalH = middleColRef.current?.getBoundingClientRect().height ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientY - startY) / totalH) * 100;
      setNotesHeight(Math.max(MIN_ROW, Math.min(100 - todoHeight - MIN_ROW, startNotes + delta)));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [notesHeight, todoHeight]);

  const habitsHeight = 100 - todoHeight - notesHeight;

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

        {/* Middle — Todo / Notes / Habits */}
        <div className="flex flex-col overflow-hidden flex-1" ref={middleColRef}>
          <div className="overflow-hidden flex flex-col shrink-0" style={{ height: `${todoHeight}%` }}>
            <TodoList date={selectedDate} />
          </div>

          <div {...divider(onTodoDividerDown, 'row')} />

          <div className="overflow-hidden flex flex-col shrink-0" style={{ height: `${notesHeight}%` }}>
            <NotesPanel date={selectedDate} />
          </div>

          <div {...divider(onNotesDividerDown, 'row')} />

          <div className="overflow-hidden flex flex-col" style={{ height: `${habitsHeight}%` }}>
            <HabitTracker selectedDate={selectedDate} />
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
