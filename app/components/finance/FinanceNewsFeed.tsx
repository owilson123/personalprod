'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from '@/app/components/ui/SectionHeader';

interface NewsItem { title: string; url: string; }

export function FinanceNewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance-news');
      if (res.ok) {
        const data = await res.json();
        const items = (data.articles ?? data ?? []) as Array<{ title?: string; url?: string; link?: string }>;
        setNews(items.map(i => ({ title: i.title ?? '', url: i.url ?? i.link ?? '#' })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="flex flex-col">
      <SectionHeader title="Finance News" />
      <div className="px-3 pb-3">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 rounded animate-pulse" style={{ background: 'var(--bg-input)', width: `${60 + (i % 4) * 8}%` }} />
                <div className="h-3 rounded animate-pulse w-2/5" style={{ background: 'var(--bg-input)' }} />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 12 }}>No news available</p>
        ) : (
          <div>
            {news.slice(0, 10).map((item, i) => (
              <div key={i}>
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="block px-3 py-2 rounded-lg leading-snug transition-all no-underline"
                  style={{ fontSize: 12, color: 'var(--text-hover)' }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--bg-input)';
                    e.currentTarget.style.paddingLeft = '14px';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '12px';
                  }}>
                  {item.title}
                </a>
                {i < Math.min(news.length, 10) - 1 && (
                  <div style={{ height: 1, background: 'var(--border-subtle)', marginLeft: 12, marginRight: 12 }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
