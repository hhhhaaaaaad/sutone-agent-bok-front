'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
        setError(e instanceof Error ? e.message : '加载文章失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const featured = articles[0];
  const listItems = articles.slice(featured ? 1 : 0);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((article) => {
      article.tags?.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [articles]);

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto grid min-h-[calc(100vh-40px)] max-w-[1280px] grid-cols-1 overflow-hidden xl:grid-cols-[248px_minmax(0,1fr)_280px]">
        <aside className="workspace-sidebar-soft flex flex-col gap-5 px-5 py-6">
          <div>
            <p className="workspace-mono text-[11px] tracking-[0.16em] text-[#858c96]">文章工作区</p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-tight text-[#22252a]">文章广场</h1>
          </div>

          <div className="space-y-2">
            {[
              { label: 'AI 首页', path: '/' },
              { label: '内容库', path: '/articles' },
              { label: '草稿队列', path: '/drafts' },
              { label: '个人中心', path: '/me' },
            ].map((item, index) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex h-[42px] w-full items-center rounded-[8px] px-4 text-left text-sm transition-colors ${
                  index === 1
                    ? 'border border-[#e6e2db] bg-white text-[#22252a]'
                    : 'text-[#5d636c] hover:bg-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="workspace-panel rounded-[12px] p-4 text-sm leading-7 text-[#5d636c]">
            这里保留已经完成发布的内容，以及适合二次编辑、专题整理和归档回顾的文章资产。
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-[#fcfbf8]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e2db] px-5 py-4 md:px-7">
            <div>
              <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">工作区 / 文章广场</p>
              <h2 className="mt-1 text-[34px] font-semibold tracking-tight text-[#22252a]">浏览已经完成发布的内容</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input className="workspace-search w-[180px]" placeholder="搜索标题、主题或标签" />
              <button onClick={() => router.push('/me')} className="workspace-secondary-btn px-4 py-2.5 text-sm font-medium">
                管理归档
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
            {error && (
              <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <p className="py-16 text-center text-sm text-[#858c96]">文章加载中...</p>
            ) : articles.length === 0 ? (
              <div className="workspace-panel rounded-[16px] p-8 text-center text-sm text-[#858c96]">
                当前还没有发布文章。
              </div>
            ) : (
              <>
                {featured && (
                  <section className="workspace-subpanel rounded-[16px] p-5 md:p-6">
                    <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="workspace-panel rounded-[12px] p-4">
                        <p className="text-xs text-[#858c96]">推荐文章</p>
                        <div className="mt-4 space-y-2 text-sm text-[#5d636c]">
                          {(featured.tags?.slice(0, 3) ?? ['发布中']).map((tag) => (
                            <div key={tag} className="workspace-status w-fit">{tag}</div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-[#858c96]">本期推荐</p>
                        <h3 className="workspace-editorial mt-2 max-w-[16ch] text-[38px] leading-[1.02] text-[#22252a] md:text-[52px]">
                          {featured.title}
                        </h3>
                        <p className="mt-3 max-w-[56ch] text-sm leading-7 text-[#5d636c]">
                          {featured.summary || '这篇文章已经进入可公开阅读状态，适合作为专题内容、案例复盘或长期知识资产的代表页。'}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-[#858c96]">
                          <span>{featured.publishTime || '刚刚发布'}</span>
                          <span>{featured.viewCount} 阅读</span>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            onClick={() => router.push(`/articles/${featured.articleId}`)}
                            className="workspace-primary-btn px-4 py-2.5 text-sm font-medium"
                          >
                            阅读文章
                          </button>
                          <button onClick={() => router.push('/drafts')} className="workspace-secondary-btn px-4 py-2.5 text-sm font-medium">
                            前往草稿区
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <section className="mt-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-[#22252a]">精选文章</h3>
                    <div className="flex gap-2">
                      {['最新', '发布', '笔记'].map((item) => (
                        <span key={item} className="workspace-toolbar-chip">{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {listItems.length === 0 ? (
                      <div className="workspace-panel rounded-[16px] p-5 text-sm text-[#858c96]">暂无更多文章。</div>
                    ) : (
                      listItems.map((article) => (
                        <button
                          key={article.articleId}
                          onClick={() => router.push(`/articles/${article.articleId}`)}
                          className="workspace-panel workspace-panel-hover grid w-full grid-cols-[80px_minmax(0,1fr)] gap-4 rounded-[16px] p-5 text-left"
                        >
                          <div className="workspace-subpanel flex items-center justify-center rounded-[10px] text-xs text-[#b5aea4]">
                            封面
                          </div>
                          <div>
                            <h4 className="text-[22px] font-medium tracking-tight text-[#22252a]">{article.title}</h4>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5d636c]">
                              {article.summary || '暂无摘要。'}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#858c96]">
                              {article.tags?.slice(0, 3).map((tag) => (
                                <span key={tag} className="workspace-status">{tag}</span>
                              ))}
                              <span>{article.publishTime || '刚刚发布'}</span>
                              <span>{article.viewCount} 阅读</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>

        <aside className="workspace-right-rail hidden xl:flex xl:flex-col xl:gap-5 xl:px-5 xl:py-6">
          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">作者注记</p>
            <p className="mt-3 text-sm leading-6 text-[#5d636c]">
              右侧保持专题描述、阅读路径和标签线索，帮助内容从单篇文章自然过渡到系列化知识页面。
            </p>
          </div>

          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">主题标签</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topics.length === 0 ? (
                <span className="text-sm text-[#858c96]">暂无标签</span>
              ) : (
                topics.map(([tag]) => (
                  <span key={tag} className="workspace-status">
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
