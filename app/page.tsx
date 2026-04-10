'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { DashboardHeader } from '@/app/components/header/DashboardHeader';
import { TimeBlockingPanel } from '@/app/components/time-blocking/TimeBlockingPanel';
import { TodoList } from '@/app/components/productivity/TodoList';
import { NotesPanel } from '@/app/components/productivity/NotesPanel';
import { HabitTracker } from '@/app/components/productivity/HabitTracker';
import { FinancePanel } from '@/app/components/finance/FinancePanel';
import { LoginModal } from '@/app/components/auth/LoginModal';
import { TodoDragProvider } from '@/app/components/todo-drag-context';
import { MobileLayout } from '@/app/components/mobile/MobileLayout';
import { useMobileLayout } from '@/app/hooks/useMobileLayout';

const MIN_COL = 10; // percent
const MAX_COL = 60;
const MIN_ROW = 10;

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export default function DashboardPage() {
  // ── Auth state ───────────────────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; isAdmin: boolean } | null>(null);

  const isMobile = useMobileLayout();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    // Run setup migration then check session
    fetch('/api/setup', { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        fetch('/api/auth/me')
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data?.name) setCurrentUser({ name: data.name, isAdmin: data.isAdmin });
          })
          .catch(() => {})
          .finally(() => setAuthChecked(true));
      });
  }, []);

  function handleLogin(name: string, isAdmin: boolean) {
    setCurrentUser({ name, isAdmin });
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
  }

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

  const [leftWidth,   setLeftWidth]   = useState(() => Number(typeof window !== 'undefined' && localStorage.getItem('layout.leftWidth')  || 25));
  const [rightWidth,  setRightWidth]  = useState(() => Number(typeof window !== 'undefined' && localStorage.getItem('layout.rightWidth') || 25));
  const [todoHeight,  setTodoHeight]  = useState(() => Number(typeof window !== 'undefined' && localStorage.getItem('layout.todoHeight') || 30));
  const [bottomTab,   setBottomTab]   = useState<'habits' | 'notes'>(() => (typeof window !== 'undefined' && localStorage.getItem('layout.bottomTab') as 'habits' | 'notes') || 'habits');

  // Load layout from DB on mount (overrides localStorage if DB has values)
  useEffect(() => {
    if (!currentUser) return;
    fetch('/api/preferences')
      .then(r => r.ok ? r.json() : null)
      .then((prefs: Record<string, string> | null) => {
        if (!prefs) return;
        if (prefs['layout.leftWidth'])  setLeftWidth(Number(prefs['layout.leftWidth']));
        if (prefs['layout.rightWidth']) setRightWidth(Number(prefs['layout.rightWidth']));
        if (prefs['layout.todoHeight']) setTodoHeight(Number(prefs['layout.todoHeight']));
        if (prefs['layout.bottomTab'])  setBottomTab(prefs['layout.bottomTab'] as 'habits' | 'notes');
      })
      .catch(() => {});
  }, [currentUser]);

  // Save to localStorage immediately and to DB with debounce
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleDbSave = useCallback((patch: Record<string, string>) => {
    Object.entries(patch).forEach(([k, v]) => localStorage.setItem(k, v));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {});
    }, 1000);
  }, []);

  useEffect(() => { scheduleDbSave({ 'layout.leftWidth':  String(leftWidth)  }); }, [leftWidth,  scheduleDbSave]);
  useEffect(() => { scheduleDbSave({ 'layout.rightWidth': String(rightWidth) }); }, [rightWidth, scheduleDbSave]);
  useEffect(() => { scheduleDbSave({ 'layout.todoHeight': String(todoHeight) }); }, [todoHeight, scheduleDbSave]);
  useEffect(() => { scheduleDbSave({ 'layout.bottomTab':  bottomTab          }); }, [bottomTab,  scheduleDbSave]);

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
      background: 'var(--border-subtle)', cursor: `${axis}-resize`, flexShrink: 0 as const,
      transition: 'background 0.15s',
    } as React.CSSProperties,
    onMouseDown: onDown,
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'var(--border-hover)'),
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'var(--border-subtle)'),
  });

  // ── Render ───────────────────────────────────────────────────────────────

  // Show nothing while checking auth (avoids flash)
  if (!authChecked) {
    return <div style={{ background: 'var(--bg-dark)', height: '100dvh' }} />;
  }

  // Show login modal when not authenticated — do NOT mount dashboard panels
  // until logged in, otherwise they fetch data (get 401) and won't re-fetch.
  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} />;
  }

  if (isMobile) {
    return (
      <TodoDragProvider>
        <MobileLayout selectedDate={selectedDate} onPrev={goToPrev} onNext={goToNext} currentUser={currentUser} onLogout={handleLogout} />
      </TodoDragProvider>
    );
  }

  return (
    <TodoDragProvider>
    <div className="desktop-layout-root flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-dark)' }}>
      <DashboardHeader
        selectedDate={selectedDate}
        onPrev={goToPrev}
        onNext={goToNext}
        currentUser={currentUser}
        onLogout={handleLogout}
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
            <div style={{ display: 'flex', background: 'var(--bg-tabbar)', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
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
                    borderBottom: bottomTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    color: bottomTab === tab ? 'var(--accent-blue)' : 'var(--text-muted)',
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
    </TodoDragProvider>
  );
}
