'use client';

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
      <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, var(--accent-blue), var(--accent-blue-deep))' }} />
      <h2 className="font-semibold tracking-tight" style={{ fontSize: 13, color: 'var(--text-main)' }}>{title}</h2>
      {subtitle && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
