'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { articlesApi } from '@/api/articles';
import type { ArticlePageItem } from '@/types/article';

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
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
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto grid min-h-[calc(100vh-40px)] max-w-[1180px] grid-cols-1 overflow-hidden xl:grid-cols-[248px_1fr]">
        <aside className="workspace-sidebar flex flex-col gap-5 px-5 py-6">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-[#22252a]">文章广场</h1>
            <p className="workspace-mono mt-1 text-[11px] tracking-[0.16em] text-[#858c96]">
              内容发布区
            </p>
          </div>
          <div className="space-y-2">
            {[
              { label: '返回首页', path: '/' },
              { label: '草稿列表', path: '/drafts' },
              { label: '文章广场', path: '/articles' },
            ].map((item, index) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex h-[42px] w-full items-center rounded-[8px] px-4 text-left text-sm ${
                  index === 2 ? 'border border-[#e6e2db] bg-white text-[#22252a]' : 'text-[#5d636c] hover:bg-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="workspace-panel rounded-[12px] p-4 text-sm leading-7 text-[#5d636c]">
            这里展示已发布的文章内容，可快速进入详情查看摘要、标签和正文。
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-[#fcfbf8]">
          <header className="border-b border-[#e6e2db] px-5 py-4 md:px-7">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">工作区 / 文章广场</p>
            <h2 className="mt-1 text-[34px] font-semibold tracking-tight text-[#22252a]">浏览已经完成发布的文章</h2>
          </header>

          <div className="flex-1 overflow-y-auto p-5 md:p-6">
            {loading && <p className="py-12 text-center text-sm text-[#858c96]">文章加载中...</p>}
            {error && <p className="py-12 text-center text-sm text-red-500">{error}</p>}

            {!loading && !error && articles.length === 0 && (
              <div className="workspace-panel rounded-[16px] p-8 text-center text-sm text-[#858c96]">当前还没有发布文章。</div>
            )}

            <div className="grid gap-4">
              {articles.map(article => (
                <button
                  key={article.articleId}
                  onClick={() => router.push(`/articles/${article.articleId}`)}
                  className="workspace-panel w-full rounded-[16px] p-5 text-left transition-colors hover:bg-white"
                >
                  <h3 className="text-[28px] font-medium tracking-tight text-[#22252a]">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5d636c]">{article.summary || '暂无摘要'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#858c96]">
                    {article.tags?.map(tag => (
                      <span key={tag} className="workspace-status">{tag}</span>
                    ))}
                    <span>{article.publishTime || '刚刚发布'}</span>
                    <span>{article.viewCount} 阅读</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
