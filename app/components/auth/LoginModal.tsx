'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  onLogin: (name: string, isAdmin: boolean) => void;
}

export function LoginModal({ onLogin }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (visible) nameRef.current?.focus();
  }, [visible]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.name, data.isAdmin);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Invalid credentials');
        setPassword('');
      }
    } catch {
      setError('Connection error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10, 11, 16, 0.85)',
        backdropFilter: 'blur(6px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          margin: '0 16px',
          background: '#1a1b23',
          border: '1px solid #2a2b3d',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,125,249,0.08)',
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
      >
        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f7df9 0%, #7c3aed 100%)',
              marginBottom: '14px',
              boxShadow: '0 8px 24px rgba(79,125,249,0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#f0f0f5', letterSpacing: '-0.02em' }}>
            Command Center
          </div>
          <div style={{ fontSize: '13px', color: '#8b8ca0', marginTop: '4px' }}>
            Sign in to your workspace
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Name field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b8ca0', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="Your name"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                background: '#242530',
                border: `1px solid ${error ? '#ff4757' : '#2a2b3d'}`,
                borderRadius: '10px',
                color: '#f0f0f5',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#4f7df9';
                e.target.style.boxShadow = '0 0 0 3px rgba(79,125,249,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = error ? '#ff4757' : '#2a2b3d';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password field */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8b8ca0', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                background: '#242530',
                border: `1px solid ${error ? '#ff4757' : '#2a2b3d'}`,
                borderRadius: '10px',
                color: '#f0f0f5',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#4f7df9';
                e.target.style.boxShadow = '0 0 0 3px rgba(79,125,249,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = error ? '#ff4757' : '#2a2b3d';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                fontSize: '13px',
                color: '#ff4757',
                background: 'rgba(255,71,87,0.08)',
                border: '1px solid rgba(255,71,87,0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !name.trim() || !password}
            style={{
              marginTop: '4px',
              padding: '11px 20px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: loading || !name.trim() || !password
                ? '#2a2b3d'
                : 'linear-gradient(135deg, #4f7df9 0%, #6366f1 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !name.trim() || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
              boxShadow: loading || !name.trim() || !password
                ? 'none'
                : '0 4px 16px rgba(79,125,249,0.3)',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => {
              if (!loading && name.trim() && password) {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(79,125,249,0.4)';
              }
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.target as HTMLButtonElement).style.boxShadow = loading || !name.trim() || !password ? 'none' : '0 4px 16px rgba(79,125,249,0.3)';
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing in…
              </>
            ) : 'Sign in'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
