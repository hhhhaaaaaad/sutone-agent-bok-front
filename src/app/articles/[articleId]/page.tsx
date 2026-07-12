'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { articlesApi } from '@/api/articles';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import type { ArticleDetailResponse } from '@/types/article';
import WorkspaceHeader from '@/components/WorkspaceHeader';

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = Number(params.articleId);
  const [article, setArticle] = useState<ArticleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reverting, setReverting] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!articleId) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;
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

  const handleRevertToDraft = async () => {
    if (!articleId || reverting) return;
    setReverting(true);
    try {
      const resp = await articlesApi.revertToDraft(articleId);
      router.push(`/drafts/${resp.data.draftId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '回退失败');
      setReverting(false);
    }
  };

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
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto max-w-[980px] overflow-hidden bg-[#fcfbf8]">
        <WorkspaceHeader activePath="/articles" />
        <header className="border-b border-[#e6e2db] flex items-center justify-between px-5 py-4 md:px-7">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/articles')} className="workspace-secondary-btn px-3 py-2 text-sm font-medium">
              返回文章广场
            </button>
            <button
              onClick={handleRevertToDraft}
              disabled={reverting}
              className="workspace-primary-btn px-3 py-2 text-sm font-medium disabled:opacity-40"
            >
              {reverting ? '回退中...' : '继续编辑'}
            </button>
          </div>
          <p className="workspace-mono hidden text-[11px] tracking-[0.14em] text-[#858c96] sm:block">工作区 / 文章详情</p>
        </header>

        <main className="px-5 py-8 md:px-10 md:py-10">
          <h1 className="workspace-editorial text-[42px] leading-[1.05] text-[#22252a] md:text-[56px]">{article.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[#858c96]">
            <span>发布于 {article.publishTime}</span>
            <span>{article.viewCount} 阅读</span>
            {article.tags?.map(tag => (
              <span key={tag} className="workspace-status">{tag}</span>
            ))}
          </div>

          {article.summary && (
            <div className="workspace-subpanel mt-8 rounded-[12px] p-5 text-sm leading-7 text-[#5d636c] italic">
              {article.summary}
            </div>
          )}

          <article className="article-markdown prose prose-slate mt-10 max-w-none prose-headings:text-[#22252a] prose-p:text-[#3f444b] prose-li:text-[#4f555d]">
            <MarkdownRenderer
              key={article.articleId}
              content={article.contentMd || ''}
            />
          </article>

          <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-[#e6e2db] pt-6">
            <button disabled className="workspace-secondary-btn px-4 py-2 text-sm text-[#858c96] disabled:cursor-not-allowed">
              点赞 {article.likeCount}
            </button>
            <button disabled className="workspace-secondary-btn px-4 py-2 text-sm text-[#858c96] disabled:cursor-not-allowed">
              收藏 {article.favoriteCount}
            </button>
            <span className="ml-auto text-xs text-[#858c96]">互动功能将在后续阶段接入</span>
          </div>
        </main>
      </div>
    </div>
  );
}
