'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Short',  minutes: 25, color: '#f59e0b', dim: 'rgba(245,158,11,0.12)',  glow: 'rgba(245,158,11,0.4)'  },
  { label: 'Long',   minutes: 50, color: '#6366f1', dim: 'rgba(99,102,241,0.12)',  glow: 'rgba(99,102,241,0.4)'  },
  { label: 'Custom', minutes: 0,  color: '#e879f9', dim: 'rgba(232,121,249,0.12)', glow: 'rgba(232,121,249,0.4)' },
] as const;

type PresetKey = 0 | 1 | 2;
type Phase = 'idle' | 'running' | 'paused' | 'done';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Styles injected once ─────────────────────────────────────────────────────
const STYLE_ID = 'timer-panel-v2';
const CSS = `
@keyframes tp-bar {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}
@keyframes tp-fadein {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tp-done {
  0%   { transform: scale(1); }
  20%  { transform: scale(1.04); }
  40%  { transform: scale(0.98); }
  60%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}
@keyframes tp-pop {
  0%   { transform: scale(0); opacity: 0; }
  70%  { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes tp-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
.tp-btn-main:hover { filter: brightness(1.1); transform: translateY(-1px); }
.tp-btn-main:active { transform: translateY(0); filter: brightness(0.95); }
.tp-preset:hover { border-color: var(--tp-c) !important; color: var(--tp-c) !important; }
`;

function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ── Component ────────────────────────────────────────────────────────────────
export function TimerPanel() {
  const [preset,    setPreset]    = useState<PresetKey>(0);
  const [phase,     setPhase]     = useState<Phase>('idle');
  const [secsLeft,  setSecsLeft]  = useState(PRESETS[0].minutes * 60);
  const [totalSecs, setTotalSecs] = useState(PRESETS[0].minutes * 60);
  const [sessions,  setSessions]  = useState(0);
  const [customMin, setCustomMin] = useState(45);
  const [doneAnim,  setDoneAnim]  = useState(false);
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
    const t = setTimeout(() => setDoneAnim(false), 800);
    return () => clearTimeout(t);
  }, [doneAnim]);

  const applyPreset = useCallback((idx: PresetKey) => {
    setPreset(idx);
    setPhase('idle');
    clearInterval(intervalRef.current!);
    const mins = idx === 2 ? customMin : PRESETS[idx].minutes;
    setSecsLeft(mins * 60);
    setTotalSecs(mins * 60);
  }, [customMin]);

  const handleStart  = () => setPhase('running');
  const handlePause  = () => setPhase('paused');
  const handleResume = () => setPhase('running');
  const handleReset  = () => {
    clearInterval(intervalRef.current!);
    setPhase('idle');
    const mins = preset === 2 ? customMin : PRESETS[preset].minutes;
    setSecsLeft(mins * 60);
    setTotalSecs(mins * 60);
  };

  const handleCustomChange = (val: number) => {
    const clamped = Math.max(1, Math.min(480, val));
    setCustomMin(clamped);
    if (preset === 2) {
      setSecsLeft(clamped * 60);
      setTotalSecs(clamped * 60);
      setPhase('idle');
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const cfg      = PRESETS[preset];
  const progress = totalSecs > 0 ? secsLeft / totalSecs : 1;
  const isRunning = phase === 'running';
  const isPaused  = phase === 'paused';
  const isDone    = phase === 'done';
  const isIdle    = phase === 'idle';

  const statusLabel = isDone ? 'Done' : isRunning ? 'Focusing' : isPaused ? 'Paused' : cfg.label;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '14px 18px 14px',
      gap: '12px',
      overflowY: 'auto',
      animation: 'tp-fadein 0.25s ease',
    }}>

      {/* ── Preset row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {PRESETS.map((p, i) => {
          const active = preset === i;
          return (
            <button
              key={p.label}
              className="tp-preset"
              onClick={() => applyPreset(i as PresetKey)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: `1.5px solid ${active ? p.color : 'var(--border-subtle)'}`,
                background: active ? p.dim : 'transparent',
                color: active ? p.color : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '--tp-c': p.color,
              } as React.CSSProperties}
            >
              {p.label}
              {i !== 2 && (
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, opacity: 0.7, marginTop: '1px' }}>
                  {p.minutes}m
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Custom input ──────────────────────────────────────────────────── */}
      {preset === 2 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => handleCustomChange(customMin - 5)}
            style={{ ...nudgeBtnStyle, color: cfg.color, borderColor: cfg.color + '44' }}
          >−</button>
          <div style={{ textAlign: 'center' }}>
            <input
              type="number"
              min={1} max={480}
              value={customMin}
              onChange={e => handleCustomChange(Number(e.target.value))}
              style={{
                width: '52px',
                padding: '3px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: `1.5px solid ${cfg.color}66`,
                color: cfg.color,
                fontSize: '18px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '1px' }}>MINUTES</div>
          </div>
          <button
            onClick={() => handleCustomChange(customMin + 5)}
            style={{ ...nudgeBtnStyle, color: cfg.color, borderColor: cfg.color + '44' }}
          >+</button>
        </div>
      )}

      {/* ── Time display ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        animation: doneAnim ? 'tp-done 0.8s ease' : 'none',
        flex: 1,
        justifyContent: 'center',
      }}>
        {/* Status label */}
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: isDone || isRunning ? cfg.color : 'var(--text-muted)',
          transition: 'color 0.3s ease',
          marginBottom: '2px',
        }}>
          {statusLabel}
        </div>

        {/* Big time */}
        <div style={{
          fontSize: '52px',
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: isDone ? cfg.color : 'var(--text-main)',
          transition: 'color 0.3s ease',
          animation: isPaused ? 'tp-blink 1.8s ease-in-out infinite' : 'none',
        }}>
          {isDone ? '✓' : fmtTime(secsLeft)}
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%',
          maxWidth: 220,
          height: 3,
          borderRadius: 99,
          background: 'var(--border-subtle)',
          marginTop: '10px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            borderRadius: 99,
            background: cfg.color,
            boxShadow: `0 0 8px ${cfg.glow}`,
            transition: 'width 0.85s linear, background 0.4s ease, box-shadow 0.4s ease',
            animation: isRunning ? 'tp-bar 3s ease-in-out infinite' : 'none',
          }} />
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
        {!isIdle && (
          <button onClick={handleReset} title="Reset" style={iconBtnStyle}>
            <ResetIcon />
          </button>
        )}

        {(isIdle || isDone) && (
          <button
            className="tp-btn-main"
            onClick={handleStart}
            style={mainBtnStyle(cfg.color, cfg.glow)}
          >
            {isDone ? 'Again' : 'Start'}
          </button>
        )}
        {isRunning && (
          <button className="tp-btn-main" onClick={handlePause} style={mainBtnStyle(cfg.color, cfg.glow)}>
            Pause
          </button>
        )}
        {isPaused && (
          <button className="tp-btn-main" onClick={handleResume} style={mainBtnStyle(cfg.color, cfg.glow)}>
            Resume
          </button>
        )}
      </div>

      {/* ── Session ticks ─────────────────────────────────────────────────── */}
      {(sessions > 0 || !isIdle) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {Array.from({ length: Math.max(sessions, 1) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  background: i < sessions ? cfg.color : 'var(--border-subtle)',
                  boxShadow: i < sessions ? `0 0 6px ${cfg.glow}` : 'none',
                  transition: 'background 0.3s, box-shadow 0.3s',
                  animation: i === sessions - 1 && doneAnim ? 'tp-pop 0.5s ease' : 'none',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              {sessions} session{sessions !== 1 ? 's' : ''}
            </span>
            {sessions > 0 && (
              <button
                onClick={() => setSessions(0)}
                style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.6 }}
              >
                clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function mainBtnStyle(color: string, glow: string): React.CSSProperties {
  return {
    padding: '9px 32px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    background: color,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 4px 18px ${glow}`,
    transition: 'filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease',
  };
}

const iconBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1.5px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  cursor: 'pointer',
};

const nudgeBtnStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1.5px solid',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  lineHeight: 1,
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <polyline points="3 3 3 8 8 8" />
    </svg>
  );
}
