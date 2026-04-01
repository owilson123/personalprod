'use client';

import { useState, useCallback, useRef } from 'react';
import { DashboardHeader } from '@/app/components/header/DashboardHeader';
import { TimeBlockingPanel } from '@/app/components/time-blocking/TimeBlockingPanel';
import { TodoList } from '@/app/components/productivity/TodoList';
import { NotesPanel } from '@/app/components/productivity/NotesPanel';
import { HabitTracker } from '@/app/components/productivity/HabitTracker';
import { FinancePanel } from '@/app/components/finance/FinancePanel';

const MIN_COL = 10; // percent
const MAX_COL = 60;
const MIN_ROW = 10;

export default function DashboardPage() {
  const [leftWidth, setLeftWidth] = useState(25);   // percent
  const [rightWidth, setRightWidth] = useState(25); // percent
  const [todoHeight, setTodoHeight] = useState(30); // percent of middle col
  const [notesHeight, setNotesHeight] = useState(40);

  const containerRef = useRef<HTMLDivElement>(null);
  const middleColRef = useRef<HTMLDivElement>(null);

  // Drag left vertical divider (left | middle border)
  const onLeftDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startLeft = leftWidth;
    const totalW = containerRef.current?.getBoundingClientRect().width ?? 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / totalW) * 100;
      setLeftWidth(Math.max(MIN_COL, Math.min(MAX_COL, startLeft + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [leftWidth]);

  // Drag right vertical divider (middle | right border)
  const onRightDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startRight = rightWidth;
    const totalW = containerRef.current?.getBoundingClientRect().width ?? 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / totalW) * 100;
      setRightWidth(Math.max(MIN_COL, Math.min(MAX_COL, startRight - delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [rightWidth]);

  // Drag todo/notes horizontal divider
  const onTodoDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startTodo = todoHeight;
    const totalH = middleColRef.current?.getBoundingClientRect().height ?? 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientY - startY) / totalH) * 100;
      const newTodo = Math.max(MIN_ROW, Math.min(100 - notesHeight - MIN_ROW, startTodo + delta));
      setTodoHeight(newTodo);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [todoHeight, notesHeight]);

  // Drag notes/habits horizontal divider
  const onNotesDividerDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startNotes = notesHeight;
    const totalH = middleColRef.current?.getBoundingClientRect().height ?? 1;

    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientY - startY) / totalH) * 100;
      const newNotes = Math.max(MIN_ROW, Math.min(100 - todoHeight - MIN_ROW, startNotes + delta));
      setNotesHeight(newNotes);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [notesHeight, todoHeight]);

  const habitsHeight = 100 - todoHeight - notesHeight;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      <DashboardHeader />

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* Left — Time Blocking */}
        <div className="flex flex-col overflow-hidden shrink-0" style={{ width: `${leftWidth}%` }}>
          <TimeBlockingPanel />
        </div>

        {/* Vertical divider: left / middle */}
        <div
          onMouseDown={onLeftDividerDown}
          style={{
            width: '4px',
            background: '#1e1f2a',
            cursor: 'col-resize',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#3a3b52')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1e1f2a')}
        />

        {/* Middle — Todo / Notes / Habits */}
        <div className="flex flex-col overflow-hidden flex-1" ref={middleColRef}>
          <div className="overflow-hidden flex flex-col shrink-0" style={{ height: `${todoHeight}%` }}>
            <TodoList />
          </div>

          {/* Horizontal divider: todo / notes */}
          <div
            onMouseDown={onTodoDividerDown}
            style={{
              height: '4px',
              background: '#1e1f2a',
              cursor: 'row-resize',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3a3b52')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e1f2a')}
          />

          <div className="overflow-hidden flex flex-col shrink-0" style={{ height: `${notesHeight}%` }}>
            <NotesPanel />
          </div>

          {/* Horizontal divider: notes / habits */}
          <div
            onMouseDown={onNotesDividerDown}
            style={{
              height: '4px',
              background: '#1e1f2a',
              cursor: 'row-resize',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3a3b52')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1e1f2a')}
          />

          <div className="overflow-hidden flex flex-col" style={{ height: `${habitsHeight}%` }}>
            <HabitTracker />
          </div>
        </div>

        {/* Vertical divider: middle / right */}
        <div
          onMouseDown={onRightDividerDown}
          style={{
            width: '4px',
            background: '#1e1f2a',
            cursor: 'col-resize',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#3a3b52')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1e1f2a')}
        />

        {/* Right — Finance Panel */}
        <div className="flex flex-col overflow-hidden shrink-0" style={{ width: `${rightWidth}%` }}>
          <FinancePanel />
        </div>
      </div>
    </div>
  );
}
