'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { recommendApi } from '@/api/recommend';
import type { ArticlePageItem } from '@/types/article';

export default function RecommendList() {
  const [items, setItems] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const resp = await recommendApi.recommend(4);
        setItems(resp.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="border-t border-[#e6e2db] pt-8 mt-12"><p className="text-sm text-slate-400">推荐加载中...</p></div>;
  if (items.length === 0) return null;

  return (
    <div className="border-t border-[#e6e2db] pt-8 mt-12">
      <h3 className="text-lg font-semibold text-[#22252a] mb-4">推荐阅读</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link
            key={item.articleId}
            href={`/articles/${item.articleId}`}
            className="block p-4 rounded-lg border border-[#e6e2db] hover:border-blue-300 transition-colors"
          >
            <h4 className="text-sm font-medium text-[#22252a] line-clamp-2">{item.title}</h4>
            {item.summary && (
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.summary}</p>
            )}
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>{item.authorName}</span>
              <span>{item.viewCount} 阅读</span>
              <span>{item.likeCount} 赞</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
