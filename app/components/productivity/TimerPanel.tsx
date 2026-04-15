'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Presets ──────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Short',  minutes: 25, color: '#f59e0b', track: 'rgba(245,158,11,0.18)', glow: 'rgba(245,158,11,0.5)'  },
  { label: 'Long',   minutes: 50, color: '#6366f1', track: 'rgba(99,102,241,0.18)', glow: 'rgba(99,102,241,0.5)'  },
  { label: 'Custom', minutes: 0,  color: '#e879f9', track: 'rgba(232,121,249,0.18)', glow: 'rgba(232,121,249,0.5)' },
] as const;

type PresetKey = 0 | 1 | 2;
type Phase = 'idle' | 'running' | 'paused' | 'done';

function pad(n: number) { return String(n).padStart(2, '0'); }
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

const STYLE_ID = 'timer-panel-v3';
const CSS = `
@keyframes tp-fadein { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
@keyframes tp-done   { 0%{transform:scale(1)} 20%{transform:scale(1.04)} 50%{transform:scale(0.98)} 100%{transform:scale(1)} }
@keyframes tp-blink  { 0%,100%{opacity:1} 50%{opacity:0.35} }
@keyframes tp-glow   { 0%,100%{filter:drop-shadow(0 0 8px var(--tg))} 50%{filter:drop-shadow(0 0 20px var(--tg))} }
@keyframes tp-pop    { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.3);opacity:1} 100%{transform:scale(1);opacity:1} }
.tp-preset:hover { opacity: 0.85; }
.tp-main:hover   { filter: brightness(1.1); transform: translateY(-1px); }
.tp-main:active  { transform: translateY(0px); filter: brightness(0.95); }
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
    const v = Math.max(1, Math.min(480, val));
    setCustomMin(v);
    if (preset === 2) { setSecsLeft(v * 60); setTotalSecs(v * 60); setPhase('idle'); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const cfg      = PRESETS[preset];
  const progress = totalSecs > 0 ? secsLeft / totalSecs : 1;
  const isRunning = phase === 'running';
  const isPaused  = phase === 'paused';
  const isDone    = phase === 'done';
  const isIdle    = phase === 'idle';

  // Arc geometry — sized to fill available space
  const R   = 82;          // radius
  const SW  = 18;          // stroke-width — thick so progress is unmissable
  const SZ  = (R + SW) * 2 + 4;
  const CX  = SZ / 2;
  const CY  = SZ / 2;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - progress);

  // Colour shifts toward red as time runs out
  const urgency = 1 - progress;
  const arcColor = isDone
    ? cfg.color
    : urgency > 0.75
      ? '#ef4444'  // red in final quarter
      : urgency > 0.5
        ? '#f97316'  // orange at halfway
        : cfg.color;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '12px 16px',
      gap: '10px',
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
                padding: '6px 0',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                border: `1.5px solid ${active ? p.color : 'var(--border-subtle)'}`,
                background: active ? `${p.color}1a` : 'transparent',
                color: active ? p.color : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
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
          <button onClick={() => handleCustomChange(customMin - 5)} style={nudgeBtn(cfg.color)}>−</button>
          <div style={{ textAlign: 'center' }}>
            <input
              type="number" min={1} max={480} value={customMin}
              onChange={e => handleCustomChange(Number(e.target.value))}
              style={{
                width: '52px', padding: '2px 0', background: 'transparent', border: 'none',
                borderBottom: `1.5px solid ${cfg.color}66`, color: cfg.color,
                fontSize: '18px', fontWeight: 700, textAlign: 'center', outline: 'none',
              }}
            />
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '1px' }}>MINUTES</div>
          </div>
          <button onClick={() => handleCustomChange(customMin + 5)} style={nudgeBtn(cfg.color)}>+</button>
        </div>
      )}

      {/* ── Ring ──────────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0,
      }}>
        <div style={{
          position: 'relative',
          width: SZ,
          height: SZ,
          flexShrink: 0,
          animation: doneAnim ? 'tp-done 0.8s ease' : 'none',
        }}>
          {/* SVG Arc */}
          <svg
            width={SZ} height={SZ}
            viewBox={`0 0 ${SZ} ${SZ}`}
            style={{
              transform: 'rotate(-90deg)',
              animation: isRunning ? `tp-glow 2.5s ease-in-out infinite` : 'none',
              '--tg': cfg.glow,
            } as React.CSSProperties}
          >
            {/* Full track — tinted, so you can see the "space" that remains to drain */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={cfg.track}
              strokeWidth={SW}
            />
            {/* Remaining time arc */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arcColor}
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 1.2s ease' }}
            />
            {/* Inner glow layer */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arcColor}
              strokeWidth={SW * 0.4}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              opacity={0.3}
              style={{
                filter: 'blur(5px)',
                transition: 'stroke-dashoffset 0.9s linear, stroke 1.2s ease',
              }}
            />
          </svg>

          {/* Centre text */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
          }}>
            {/* % remaining — instantly readable */}
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isDone ? arcColor : urgency > 0.5 ? arcColor : 'var(--text-muted)',
              transition: 'color 1.2s ease',
            }}>
              {isDone ? 'Done!' : isPaused ? 'Paused' : isIdle ? cfg.label : 'Focus'}
            </span>

            <span style={{
              fontSize: '34px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: isDone ? arcColor : urgency > 0.5 ? arcColor : 'var(--text-main)',
              transition: 'color 1.2s ease',
              animation: isPaused ? 'tp-blink 1.8s ease-in-out infinite' : 'none',
            }}>
              {isDone ? '✓' : fmtTime(secsLeft)}
            </span>

            {/* Percent remaining — a second read of progress */}
            {!isDone && (
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: urgency > 0.5 ? arcColor : 'var(--text-muted)',
                transition: 'color 1.2s ease',
                opacity: 0.8,
              }}>
                {Math.round(progress * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
        {!isIdle && (
          <button onClick={handleReset} title="Reset" style={iconBtn}>
            <ResetIcon />
          </button>
        )}
        {(isIdle || isDone) && (
          <button className="tp-main" onClick={handleStart} style={mainBtn(cfg.color, cfg.glow)}>
            {isDone ? 'Again' : 'Start'}
          </button>
        )}
        {isRunning && (
          <button className="tp-main" onClick={handlePause} style={mainBtn(cfg.color, cfg.glow)}>Pause</button>
        )}
        {isPaused && (
          <button className="tp-main" onClick={handleResume} style={mainBtn(cfg.color, cfg.glow)}>Resume</button>
        )}
      </div>

      {/* ── Sessions ──────────────────────────────────────────────────────── */}
      {sessions > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: sessions }).map((_, i) => (
              <div key={i} style={{
                width: 24, height: 4, borderRadius: 2,
                background: cfg.color,
                boxShadow: `0 0 5px ${cfg.glow}`,
                animation: i === sessions - 1 && doneAnim ? 'tp-pop 0.5s ease' : 'none',
              }} />
            ))}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {sessions} done
          </span>
          <button onClick={() => setSessions(0)} style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.55 }}>
            clear
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mainBtn(color: string, glow: string): React.CSSProperties {
  return {
    padding: '9px 32px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', background: color, color: '#fff',
    border: 'none', cursor: 'pointer', boxShadow: `0 4px 18px ${glow}`,
    transition: 'filter 0.15s, transform 0.1s, box-shadow 0.15s',
  };
}

function nudgeBtn(color: string): React.CSSProperties {
  return {
    width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'transparent', border: `1.5px solid ${color}44`,
    color, fontSize: '16px', fontWeight: 600, cursor: 'pointer', lineHeight: 1,
  };
}

const iconBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '10px', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: 'transparent', border: '1.5px solid var(--border-subtle)',
  color: 'var(--text-muted)', cursor: 'pointer',
};

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" />
    </svg>
  );
}
