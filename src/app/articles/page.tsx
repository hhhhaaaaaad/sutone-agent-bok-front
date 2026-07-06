'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { articlesApi } from '@/api/articles';
import type { ArticlePageItem } from '@/types/article';

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const resp = await articlesApi.page(1, 20);
        setArticles(resp.data.list ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen theme-bg-gradient">
      <header className="h-16 px-6 flex items-center border-b border-slate-200/60 bg-white/60 backdrop-blur-sm">
        <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-800 text-sm">&larr; 首页</button>
        <h1 className="ml-4 text-lg font-bold text-slate-800">文章广场</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading && <p className="text-slate-500 text-center mt-20">加载中...</p>}
        {error && <p className="text-red-500 text-center mt-20">{error}</p>}

        {!loading && !error && articles.length === 0 && (
          <p className="text-slate-400 text-center mt-24">暂无文章</p>
        )}

        <div className="grid gap-5">
          {articles.map(article => (
            <div
              key={article.articleId}
              onClick={() => router.push(`/articles/${article.articleId}`)}
              className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <h2 className="text-lg font-bold text-slate-800">{article.title}</h2>
              <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{article.summary || '暂无摘要'}</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {article.tags?.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{tag}</span>
                ))}
                <span className="text-xs text-slate-400">{article.publishTime}</span>
                <span className="text-xs text-slate-400">{article.viewCount} 阅读</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
