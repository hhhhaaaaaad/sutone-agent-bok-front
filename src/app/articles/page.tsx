'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { articlesApi } from '@/api/articles';
import { API_CONFIG } from '@/config/api-config';
import type { ArticlePageItem, LeaderboardItem } from '@/types/article';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import Pagination from '@/components/Pagination';

export default function ArticlesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState('');
  const [articles, setArticles] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);

  const fetchPage = (pn: number, ps: number, kw: string) => {
    setLoading(true);
    articlesApi.page({ pageNo: pn, pageSize: ps, keyword: kw || undefined })
      .then((resp) => {
        setArticles(resp.data.list ?? []);
        setTotal(resp.data.total ?? 0);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '加载文章失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    queueMicrotask(() => fetchPage(1, pageSize, ''));
  }, []);

  useEffect(() => { queueMicrotask(() => setCurrentUser(getUserInfo()?.user || '')); }, []);

  useEffect(() => {
    articlesApi.leaderboard('daily', 5)
      .then((resp) => setLeaderboard(resp.data ?? []))
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, []);

  const handleLogout = () => { clearUserInfo(); router.push('/login'); };

  const handleSearch = (value: string) => {
    setKeyword(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPageNo(1);
      fetchPage(1, pageSize, value);
    }, 400);
  };

  const handlePageChange = (pn: number, ps: number) => {
    setPageNo(pn);
    setPageSize(ps);
    fetchPage(pn, ps, keyword);
  };

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
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[1280px] flex-col overflow-hidden">
        <WorkspaceHeader activePath="/articles" userName={currentUser} onLogout={handleLogout} />
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="workspace-sidebar-soft flex flex-col gap-5 px-5 py-6">
          <div>
            <p className="workspace-mono text-[11px] tracking-[0.16em] text-[#858c96]">文章工作区</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[#22252a]">内容概览</h2>
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
              <input className="workspace-search w-[180px]" placeholder="搜索标题、主题或标签"
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
              />
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
                          {featured.authorName && <span>{featured.authorName}</span>}
                          <span>{featured.publishTime || '刚刚发布'}</span>
                          <span>{featured.viewCount} 阅读</span>
                          <span>{featured.likeCount} 赞</span>
                          <span>{featured.favoriteCount} 收藏</span>
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
                          <div className="workspace-subpanel flex h-[80px] items-center justify-center rounded-[10px] overflow-hidden">
                            {article.coverUrl ? (
                              <img
                                src={article.coverUrl.startsWith('http') ? article.coverUrl : API_CONFIG.UPLOAD_BASE + article.coverUrl}
                                alt={article.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.querySelector('.cover-fallback')!.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={`text-xs text-[#b5aea4] cover-fallback ${article.coverUrl ? 'hidden' : ''}`}>封面</span>
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
                              {article.authorName && <span>{article.authorName}</span>}
                              <span>{article.publishTime || '刚刚发布'}</span>
                              <span>{article.viewCount} 阅读</span>
                              <span>{article.likeCount} 赞</span>
                              <span>{article.favoriteCount} 收藏</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </>
            )}
            {!loading && articles.length > 0 && (
              <Pagination pageNo={pageNo} pageSize={pageSize} total={total} onChange={handlePageChange} />
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

          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">热门排行</p>
            {leaderboardLoading ? (
              <p className="mt-3 text-sm text-[#858c96]">加载中...</p>
            ) : leaderboard.length === 0 ? (
              <p className="mt-3 text-sm text-[#858c96]">暂无排行数据</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {leaderboard.map((item, index) => (
                  <li key={item.articleId}>
                    <button
                      onClick={() => router.push(`/articles/${item.articleId}`)}
                      className="workspace-ghost-btn flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left"
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                        index === 0
                          ? 'bg-[#f5d76e] text-[#5c4a1e]'
                          : index === 1
                            ? 'bg-[#d1d5db] text-[#374151]'
                            : index === 2
                              ? 'bg-[#e8c396] text-[#6b4c2a]'
                              : 'text-[#858c96]'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate text-sm text-[#5d636c]">{item.title}</span>
                      <span className="workspace-mono text-[11px] text-[#858c96]">{item.heatScore} 热度</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}
