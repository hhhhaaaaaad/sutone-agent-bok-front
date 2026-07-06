'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { articlesApi } from '@/api/articles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ArticleDetailResponse } from '@/types/article';

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.articleId);
  const [article, setArticle] = useState<ArticleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!articleId) return;
    (async () => {
      try {
        const resp = await articlesApi.detail(articleId);
        setArticle(resp.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-gradient flex items-center justify-center">
        <p className="text-slate-400">加载中...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen theme-bg-gradient flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || '文章不存在'}</p>
        <button onClick={() => router.push('/articles')} className="text-sm text-slate-500 underline">返回文章广场</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-gradient">
      <header className="h-16 px-6 flex items-center gap-4 border-b border-slate-200/60 bg-white/60 backdrop-blur-sm">
        <button onClick={() => router.push('/articles')} className="text-slate-500 hover:text-slate-800 text-sm">&larr; 文章广场</button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900">{article.title}</h1>

        {/* Meta bar */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-sm text-slate-500">发布于 {article.publishTime}</span>
          <span className="text-sm text-slate-400">{article.viewCount} 阅读</span>
          {article.tags?.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{tag}</span>
          ))}
        </div>

        {/* Summary */}
        {article.summary && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600 italic">
            {article.summary}
          </div>
        )}

        {/* Content */}
        <article className="mt-8 prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.contentMd || ''}
          </ReactMarkdown>
        </article>

        {/* Footer actions (placeholder for phase 2) */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex items-center gap-4">
          <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-400 disabled:cursor-not-allowed">
            👍 {article.likeCount}
          </button>
          <button disabled className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-400 disabled:cursor-not-allowed">
            ⭐ {article.favoriteCount}
          </button>
          <span className="text-xs text-slate-400 ml-auto">互动功能将在第二阶段接入</span>
        </div>
      </main>
    </div>
  );
}
