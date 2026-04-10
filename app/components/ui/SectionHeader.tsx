'use client';

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 shrink-0" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="w-1 rounded-full" style={{ height: 18, background: 'linear-gradient(180deg, var(--accent-blue), var(--accent-blue-deep))', flexShrink: 0, boxShadow: '0 0 8px rgba(79,125,249,0.4)' }} />
      <h2 className="font-bold tracking-tight" style={{ fontSize: 14, color: 'var(--text-main)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
