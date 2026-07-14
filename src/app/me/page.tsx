'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import { articlesApi } from '@/api/articles';
import { socialApi } from '@/api/social';
import type { DraftPageItem } from '@/types/draft';
import type { ArticlePageItem } from '@/types/article';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import Pagination from '@/components/Pagination';

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [activeTab, setActiveTab] = useState<'drafts' | 'articles' | 'likes' | 'favorites'>('drafts');
  const [drafts, setDrafts] = useState<DraftPageItem[]>([]);
  const [articles, setArticles] = useState<ArticlePageItem[]>([]);
  const [likedArticles, setLikedArticles] = useState<ArticlePageItem[]>([]);
  const [favoritedArticles, setFavoritedArticles] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftPageNo, setDraftPageNo] = useState(1);
  const [draftPageSize, setDraftPageSize] = useState(10);
  const [draftTotal, setDraftTotal] = useState(0);
  const [articlePageNo, setArticlePageNo] = useState(1);
  const [articlePageSize, setArticlePageSize] = useState(10);
  const [articleTotal, setArticleTotal] = useState(0);
  const [likePageNo, setLikePageNo] = useState(1);
  const [likePageSize, setLikePageSize] = useState(10);
  const [favPageNo, setFavPageNo] = useState(1);
  const [favPageSize, setFavPageSize] = useState(10);
  const fetchedRef = useRef(false);

  useEffect(() => {
    const info = getUserInfo();
    if (info) { setUser(info.user); }
  }, []);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo?.user) { router.push('/login'); return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData(1, draftPageSize, 1, articlePageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async (dpn: number, dps: number, apn: number, aps: number) => {
    const info = getUserInfo();
    setLoading(true);
    try {
      const [dResp, aResp, likeResp, favResp] = await Promise.all([
        draftsApi.page(dpn, dps),
        articlesApi.page({ pageNo: apn, pageSize: aps, userId: info?.userId }),
        socialApi.getUserLikes(),
        socialApi.getUserFavorites(),
      ]);
      setDrafts(dResp.data.list ?? []);
      setArticles(aResp.data.list ?? []);
      setLikedArticles(likeResp.data ?? []);
      setFavoritedArticles(favResp.data ?? []);
      setDraftTotal(dResp.data.total ?? 0);
      setArticleTotal(aResp.data.total ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const pagedLikes = useMemo(() => {
    const start = (likePageNo - 1) * likePageSize;
    return likedArticles.slice(start, start + likePageSize);
  }, [likedArticles, likePageNo, likePageSize]);

  const pagedFavorites = useMemo(() => {
    const start = (favPageNo - 1) * favPageSize;
    return favoritedArticles.slice(start, start + favPageSize);
  }, [favoritedArticles, favPageNo, favPageSize]);

  const handleLogout = () => {
    clearUserInfo();
    router.push('/login');
  };

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto max-w-[1280px] overflow-hidden bg-[#fcfbf8]">
        <WorkspaceHeader activePath="/me" userName={user} onLogout={handleLogout} />
        <header className="flex items-center justify-between border-b border-[#e6e2db] px-5 py-4 md:px-7">
          <div>
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">工作区 / 个人中心</p>
            <h1 className="mt-1 text-[34px] font-semibold tracking-tight text-[#22252a]">个人中心</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="workspace-secondary-btn px-3 py-2 text-sm font-medium">返回首页</button>
          </div>
        </header>

        <main className="px-5 py-8 md:px-7">
          <div className="workspace-panel rounded-[16px] p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#22252a] text-xl font-bold text-white">
                {user.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-[28px] font-medium tracking-tight text-[#22252a]">{user}</h2>
                <p className="text-sm text-[#5d636c]">正在维护你的写作项目与发布记录。</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-6">
            <aside className="w-[180px] shrink-0 space-y-1">
              {([
                { key: 'drafts' as const, label: '我的草稿', count: drafts.length },
                { key: 'articles' as const, label: '我的文章', count: articles.length },
                { key: 'likes' as const, label: '我的喜欢', count: likedArticles.length },
                { key: 'favorites' as const, label: '我的收藏', count: favoritedArticles.length },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full rounded-[10px] px-4 py-3 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[#22252a] text-white'
                      : 'text-[#5d636c] hover:bg-[#f3f0eb] hover:text-[#22252a]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`ml-2 text-xs ${activeTab === tab.key ? 'text-white/60' : 'text-[#b9b2a8]'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </aside>

            <main className="min-w-0 flex-1">
              {activeTab === 'drafts' && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-[#22252a]">最近草稿</h3>
                    <button onClick={() => router.push('/drafts')} className="text-sm text-[#858c96] hover:text-[#22252a]">查看全部</button>
                  </div>
                  {loading ? (
                    <p className="text-sm text-[#858c96]">加载中...</p>
                  ) : drafts.length === 0 ? (
                    <p className="text-sm text-[#858c96]">暂无草稿</p>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {drafts.map(d => (
                          <button key={d.draftId} onClick={() => router.push(`/drafts/${d.draftId}`)} className="workspace-panel rounded-[14px] p-4 text-left">
                            <span className="text-sm font-medium text-[#22252a]">{d.title || '未命名草稿'}</span>
                            <span className="ml-3 text-xs text-[#858c96]">{d.updateTime}</span>
                          </button>
                        ))}
                      </div>
                      <Pagination pageNo={draftPageNo} pageSize={draftPageSize} total={draftTotal} onChange={(pn, ps) => { setDraftPageNo(pn); setDraftPageSize(ps); fetchData(pn, ps, articlePageNo, articlePageSize); }} />
                    </>
                  )}
                </section>
              )}

              {activeTab === 'articles' && (
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-[#22252a]">已发布文章</h3>
                    <button onClick={() => router.push('/articles')} className="text-sm text-[#858c96] hover:text-[#22252a]">查看全部</button>
                  </div>
                  {loading ? (
                    <p className="text-sm text-[#858c96]">加载中...</p>
                  ) : articles.length === 0 ? (
                    <p className="text-sm text-[#858c96]">暂无文章</p>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {articles.map(a => (
                          <button key={a.articleId} onClick={() => router.push(`/articles/${a.articleId}`)} className="workspace-panel rounded-[14px] p-4 text-left">
                            <span className="text-sm font-medium text-[#22252a]">{a.title}</span>
                            <span className="ml-3 text-xs text-[#858c96]">{a.publishTime} · {a.viewCount} 阅读 · {a.likeCount} 赞 · {a.favoriteCount} 收藏</span>
                          </button>
                        ))}
                      </div>
                      <Pagination pageNo={articlePageNo} pageSize={articlePageSize} total={articleTotal} onChange={(pn, ps) => { setArticlePageNo(pn); setArticlePageSize(ps); fetchData(draftPageNo, draftPageSize, pn, ps); }} />
                    </>
                  )}
                </section>
              )}

              {activeTab === 'likes' && (
                <section>
                  <h3 className="mb-4 text-xl font-semibold text-[#22252a]">赞过的文章</h3>
                  {loading ? (
                    <p className="text-sm text-[#858c96]">加载中...</p>
                  ) : likedArticles.length === 0 ? (
                    <p className="text-sm text-[#858c96]">还没有赞过任何文章</p>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {pagedLikes.map(a => (
                          <button key={a.articleId} onClick={() => router.push(`/articles/${a.articleId}`)} className="workspace-panel rounded-[14px] p-4 text-left">
                            <span className="text-sm font-medium text-[#22252a]">{a.title}</span>
                            <span className="ml-3 text-xs text-[#858c96]">{a.publishTime} · {a.viewCount} 阅读 · {a.likeCount} 赞</span>
                          </button>
                        ))}
                      </div>
                      <Pagination pageNo={likePageNo} pageSize={likePageSize} total={likedArticles.length} onChange={(pn, ps) => { setLikePageNo(pn); setLikePageSize(ps); }} />
                    </>
                  )}
                </section>
              )}

              {activeTab === 'favorites' && (
                <section>
                  <h3 className="mb-4 text-xl font-semibold text-[#22252a]">收藏的文章</h3>
                  {loading ? (
                    <p className="text-sm text-[#858c96]">加载中...</p>
                  ) : favoritedArticles.length === 0 ? (
                    <p className="text-sm text-[#858c96]">还没有收藏任何文章</p>
                  ) : (
                    <>
                      <div className="grid gap-3">
                        {pagedFavorites.map(a => (
                          <button key={a.articleId} onClick={() => router.push(`/articles/${a.articleId}`)} className="workspace-panel rounded-[14px] p-4 text-left">
                            <span className="text-sm font-medium text-[#22252a]">{a.title}</span>
                            <span className="ml-3 text-xs text-[#858c96]">{a.publishTime} · {a.viewCount} 阅读 · {a.favoriteCount} 收藏</span>
                          </button>
                        ))}
                      </div>
                      <Pagination pageNo={favPageNo} pageSize={favPageSize} total={favoritedArticles.length} onChange={(pn, ps) => { setFavPageNo(pn); setFavPageSize(ps); }} />
                    </>
                  )}
                </section>
              )}
            </main>
          </div>
        </main>
      </div>
    </div>
  );
}
