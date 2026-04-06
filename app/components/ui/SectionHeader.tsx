'use client';

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 shrink-0" style={{ paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #1e1f2a' }}>
      <div className="w-1 rounded-full" style={{ height: 18, background: 'linear-gradient(180deg, #4f7df9, #3b6ae8)', flexShrink: 0 }} />
      <h2 className="font-bold tracking-tight" style={{ fontSize: 15, color: '#e8e8f0', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 12, color: '#52536a' }}>{subtitle}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
