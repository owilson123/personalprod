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
        paddingTop: 13,
        paddingBottom: 13,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          width: 4,
          height: 16,
          borderRadius: 2,
          background: accent,
          flexShrink: 0,
          boxShadow: `0 0 8px ${accent}88`,
        }}
      />
      <h2
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
          {subtitle}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}
