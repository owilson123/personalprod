'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Preset configurations ────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Focus',  minutes: 25, color: '#6366f1', glow: 'rgba(99,102,241,0.35)' },
  { label: 'Short',  minutes: 5,  color: '#00d084', glow: 'rgba(0,208,132,0.3)'   },
  { label: 'Long',   minutes: 15, color: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { label: 'Custom', minutes: 0,  color: '#f59e0b', glow: 'rgba(245,158,11,0.3)'  },
] as const;

type PresetKey = 0 | 1 | 2 | 3;
type Phase = 'idle' | 'running' | 'paused' | 'done';

const RADIUS = 88;
const CIRC = 2 * Math.PI * RADIUS;

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Keyframe CSS injected once ───────────────────────────────────────────────
const STYLE_ID = 'timer-panel-styles';
const KEYFRAMES = `
@keyframes timerPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.85; transform: scale(0.997); }
}
@keyframes timerDone {
  0%   { transform: scale(1); }
  15%  { transform: scale(1.06); }
  30%  { transform: scale(0.97); }
  45%  { transform: scale(1.03); }
  60%  { transform: scale(0.99); }
  100% { transform: scale(1); }
}
@keyframes timerRingGlow {
  0%, 100% { filter: drop-shadow(0 0 6px var(--t-glow)); }
  50%       { filter: drop-shadow(0 0 14px var(--t-glow)); }
}
@keyframes sessionPop {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes timerFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = KEYFRAMES;
  document.head.appendChild(el);
}

// ── Component ────────────────────────────────────────────────────────────────
export function TimerPanel() {
  const [preset, setPreset]         = useState<PresetKey>(0);
  const [phase,  setPhase]          = useState<Phase>('idle');
  const [secsLeft, setSecsLeft]     = useState(PRESETS[0].minutes * 60);
  const [totalSecs, setTotalSecs]   = useState(PRESETS[0].minutes * 60);
  const [sessions, setSessions]     = useState(0);
  const [customMin, setCustomMin]   = useState(30);
  const [editingCustom, setEditingCustom] = useState(false);
  const [doneAnim, setDoneAnim]     = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { injectStyles(); }, []);

  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'running') { clearInterval(intervalRef.current!); return; }
    intervalRef.current = setInterval(() => {
      setSecsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setPhase('done');
          setSessions(n => n + 1);
          setDoneAnim(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [phase]);

  useEffect(() => {
    if (!doneAnim) return;
    const t = setTimeout(() => setDoneAnim(false), 700);
    return () => clearTimeout(t);
  }, [doneAnim]);

  // ── Preset change ─────────────────────────────────────────────────────────
  const applyPreset = useCallback((idx: PresetKey) => {
    setPreset(idx);
    setPhase('idle');
    clearInterval(intervalRef.current!);
    const mins = idx === 3 ? customMin : PRESETS[idx].minutes;
    setSecsLeft(mins * 60);
    setTotalSecs(mins * 60);
  }, [customMin]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStart = () => setPhase('running');
  const handlePause = () => setPhase('paused');
  const handleReset = () => {
    clearInterval(intervalRef.current!);
    setPhase('idle');
    const mins = preset === 3 ? customMin : PRESETS[preset].minutes;
    setSecsLeft(mins * 60);
    setTotalSecs(mins * 60);
  };
  const handleResume = () => setPhase('running');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditingCustom(false);
    if (preset === 3) {
      setSecsLeft(customMin * 60);
      setTotalSecs(customMin * 60);
      setPhase('idle');
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const progress = totalSecs > 0 ? secsLeft / totalSecs : 1;
  const dashOffset = CIRC * (1 - progress);
  const cfg = PRESETS[preset];
  const color = cfg.color;
  const glow  = cfg.glow;

  const isRunning = phase === 'running';
  const isPaused  = phase === 'paused';
  const isDone    = phase === 'done';
  const isIdle    = phase === 'idle';

  // Label inside ring
  const centerLabel = isDone ? '✓' : fmtTime(secsLeft);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 16px 16px',
      gap: '18px',
      height: '100%',
      overflowY: 'auto',
      animation: 'timerFadeIn 0.3s ease',
    }}>

      {/* ── Preset selector ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {PRESETS.map((p, i) => {
          const active = preset === i;
          return (
            <button
              key={p.label}
              onClick={() => applyPreset(i as PresetKey)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: `1.5px solid ${active ? p.color : 'var(--border-subtle)'}`,
                background: active ? `${p.color}22` : 'transparent',
                color: active ? p.color : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {p.label}{i !== 3 ? ` · ${p.minutes}m` : ''}
            </button>
          );
        })}
      </div>

      {/* ── Custom duration input ─────────────────────────────────────────── */}
      {preset === 3 && (
        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min={1} max={240}
            value={customMin}
            onChange={e => setCustomMin(Math.max(1, Math.min(240, Number(e.target.value))))}
            onFocus={() => setEditingCustom(true)}
            style={{
              width: '64px',
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-main)',
              background: 'var(--bg-input)',
              color: 'var(--text-main)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>min</span>
          {editingCustom && (
            <button type="submit" style={{
              padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
              background: cfg.color, color: '#fff', border: 'none', cursor: 'pointer',
            }}>Set</button>
          )}
        </form>
      )}

      {/* ── Ring ──────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        width: 210,
        height: 210,
        flexShrink: 0,
        animation: doneAnim ? 'timerDone 0.7s ease' : isRunning ? 'timerPulse 4s ease-in-out infinite' : 'none',
        '--t-glow': glow,
      } as React.CSSProperties}>
        <svg
          width={210} height={210}
          style={{
            transform: 'rotate(-90deg)',
            animation: isRunning ? 'timerRingGlow 3s ease-in-out infinite' : 'none',
            '--t-glow': glow,
          } as React.CSSProperties}
        >
          {/* Track */}
          <circle
            cx={105} cy={105} r={RADIUS}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={10}
          />
          {/* Progress arc */}
          <circle
            cx={105} cy={105} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.85s linear, stroke 0.4s ease' }}
          />
          {/* Glow duplicate (blurred) */}
          <circle
            cx={105} cy={105} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            opacity={0.35}
            style={{
              filter: `blur(6px)`,
              transition: 'stroke-dashoffset 0.85s linear, stroke 0.4s ease',
            }}
          />
        </svg>

        {/* Center display */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}>
          <span style={{
            fontSize: isDone ? '38px' : '32px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            color: isDone ? color : 'var(--text-main)',
            transition: 'color 0.3s ease, font-size 0.2s ease',
            lineHeight: 1,
          }}>
            {centerLabel}
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isDone ? color : 'var(--text-muted)',
            transition: 'color 0.3s ease',
          }}>
            {isDone ? 'Complete!' : isRunning ? 'Focusing' : isPaused ? 'Paused' : cfg.label}
          </span>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Reset — always visible when not idle */}
        {!isIdle && (
          <button onClick={handleReset} title="Reset" style={iconBtnStyle('var(--text-muted)', 'var(--border-subtle)')}>
            <ResetIcon />
          </button>
        )}

        {/* Main action */}
        {(isIdle || isDone) && (
          <button onClick={handleStart} style={primaryBtnStyle(color)}>
            {isDone ? 'Again' : 'Start'}
          </button>
        )}
        {isRunning && (
          <button onClick={handlePause} style={primaryBtnStyle(color)}>
            Pause
          </button>
        )}
        {isPaused && (
          <button onClick={handleResume} style={primaryBtnStyle(color)}>
            Resume
          </button>
        )}
      </div>

      {/* ── Session dots ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '180px' }}>
          {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i < sessions ? color : 'var(--border-subtle)',
                boxShadow: i < sessions ? `0 0 6px ${glow}` : 'none',
                transition: 'background 0.3s ease, box-shadow 0.3s ease',
                animation: i === sessions - 1 && doneAnim ? 'sessionPop 0.5s ease' : 'none',
              }}
            />
          ))}
        </div>
        {sessions > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {sessions} session{sessions !== 1 ? 's' : ''} completed
          </span>
        )}
        {sessions > 0 && (
          <button
            onClick={() => setSessions(0)}
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              padding: 0,
            }}
          >
            reset count
          </button>
        )}
      </div>

      {/* ── Tip ───────────────────────────────────────────────────────────── */}
      {isIdle && sessions === 0 && (
        <p style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: '200px',
          lineHeight: 1.6,
          margin: 0,
        }}>
          Work in focused sprints to stay sharp. After 4 sessions, take a longer break.
        </p>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function primaryBtnStyle(color: string): React.CSSProperties {
  return {
    padding: '10px 28px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    background: color,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 4px 16px ${color}55`,
    transition: 'transform 0.1s ease, box-shadow 0.15s ease',
  };
}

function iconBtnStyle(color: string, border: string): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: `1.5px solid ${border}`,
    color,
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <polyline points="3 3 3 8 8 8" />
    </svg>
  );
}
