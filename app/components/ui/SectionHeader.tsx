'use client';

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 shrink-0" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #252636' }}>
      <div className="w-1 rounded-full" style={{ height: 18, background: 'linear-gradient(180deg, #6b9cff, #3b6ae8)', flexShrink: 0, boxShadow: '0 0 8px rgba(79,125,249,0.55)' }} />
      <h2 className="font-bold tracking-tight" style={{ fontSize: 16, color: '#ffffff', letterSpacing: '-0.025em', whiteSpace: 'nowrap', textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 12, color: '#52536a' }}>{subtitle}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
