'use client';

import { DashboardHeader } from '@/app/components/header/DashboardHeader';
import { TimeBlockingPanel } from '@/app/components/time-blocking/TimeBlockingPanel';
import { TodoList } from '@/app/components/productivity/TodoList';
import { NotesPanel } from '@/app/components/productivity/NotesPanel';
import { HabitTracker } from '@/app/components/productivity/HabitTracker';
import { FinancePanel } from '@/app/components/finance/FinancePanel';

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0f1117' }}>
      <DashboardHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Left 25% — Time Blocking */}
        <div className="flex flex-col overflow-hidden shrink-0"
          style={{ width: '25%', borderRight: '1px solid #1e1f2a' }}>
          <TimeBlockingPanel />
        </div>

        {/* Middle 50% — Todo / Notes / Habits */}
        <div className="flex flex-col overflow-hidden" style={{ width: '50%', borderRight: '1px solid #1e1f2a' }}>
          <div className="overflow-hidden flex flex-col shrink-0"
            style={{ height: '30%', borderBottom: '1px solid #1e1f2a' }}>
            <TodoList />
          </div>
          <div className="overflow-hidden flex flex-col shrink-0"
            style={{ height: '40%', borderBottom: '1px solid #1e1f2a' }}>
            <NotesPanel />
          </div>
          <div className="overflow-hidden flex flex-col" style={{ height: '30%' }}>
            <HabitTracker />
          </div>
        </div>

        {/* Right 25% — Finance Panel */}
        <div className="flex flex-col overflow-hidden shrink-0" style={{ width: '25%' }}>
          <FinancePanel />
        </div>
      </div>
    </div>
  );
}
