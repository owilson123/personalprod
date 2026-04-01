'use client';

import { Clock } from '@/app/components/ui/Clock';

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        background: 'linear-gradient(180deg, #12131a 0%, #0f1117 100%)',
        borderBottom: '1px solid #1e1f2a',
        boxShadow: '0 1px 12px rgba(0,0,0,0.3)',
      }}>
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

      <Clock />

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
