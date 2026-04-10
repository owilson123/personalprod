'use client';

import { useState, useRef, useEffect } from 'react';

interface AddSymbolModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddSymbolModal({ onClose, onAdded }: AddSymbolModalProps) {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setError('');

    try {
      // Validate by fetching quote
      const quoteRes = await fetch(`/api/finance/quote?symbols=${symbol.trim().toUpperCase()}`);
      if (quoteRes.ok) {
        const quotes = await quoteRes.json();
        if (!quotes.length || !quotes[0].price) {
          setError('Symbol not found');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
      });

      if (res.status === 409) {
        setError('Already in watchlist');
        setLoading(false);
        return;
      }

      if (res.ok) {
        onAdded();
      } else {
        setError('Failed to add');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-main)' }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ fontSize: 16, color: 'var(--text-main)' }}>Add to Watchlist</h3>
          <button onClick={onClose}
            style={{ color: 'var(--text-secondary)', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text-main)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>×</button>
        </div>

        <div className="space-y-3">
          <input
            ref={ref}
            value={symbol}
            onChange={e => { setSymbol(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter ticker symbol (e.g. AAPL)"
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none border transition-all uppercase"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-main)' }}
          />
          {error && <p style={{ color: 'var(--accent-red)', fontSize: 12 }}>{error}</p>}
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}>
            Cancel
          </button>
          <button onClick={submit} disabled={!symbol.trim() || loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-blue-deep))' }}>
            {loading ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
