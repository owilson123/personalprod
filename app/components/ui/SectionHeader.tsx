'use client';

export function SectionHeader({
  title,
  subtitle,
  action,
  accent = '#6366f1',
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 shrink-0"
      style={{
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          width: 4,
          height: 20,
          borderRadius: 2,
          background: accent,
          flexShrink: 0,
        }}
      />
      <h2
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: 'var(--text-main)',
          letterSpacing: '-0.03em',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
          {subtitle}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
