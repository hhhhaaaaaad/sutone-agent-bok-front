'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import { articlesApi } from '@/api/articles';
import type { DraftPageItem } from '@/types/draft';
import type { ArticlePageItem } from '@/types/article';
import WorkspaceHeader from '@/components/WorkspaceHeader';

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [drafts, setDrafts] = useState<DraftPageItem[]>([]);
  const [articles, setArticles] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setUser(getUserInfo()?.user || '');
  }, []);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo?.user) { router.push('/login'); return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const [dResp, aResp] = await Promise.all([
          draftsApi.page(1, 5),
          articlesApi.page(1, 5),
        ]);
        setDrafts(dResp.data.list ?? []);
        setArticles(aResp.data.list ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    clearUserInfo();
    router.push('/login');
  };

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto max-w-[980px] overflow-hidden bg-[#fcfbf8]">
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

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#22252a]">最近草稿</h3>
              <button onClick={() => router.push('/drafts')} className="text-sm text-[#858c96] hover:text-[#22252a]">查看全部</button>
            </div>
            {loading ? (
              <p className="text-sm text-[#858c96]">加载中...</p>
            ) : drafts.length === 0 ? (
              <p className="text-sm text-[#858c96]">暂无草稿</p>
            ) : (
              <div className="grid gap-3">
                {drafts.map(d => (
                  <button key={d.draftId} onClick={() => router.push(`/drafts/${d.draftId}`)} className="workspace-panel rounded-[14px] p-4 text-left">
                    <span className="text-sm font-medium text-[#22252a]">{d.title || '未命名草稿'}</span>
                    <span className="ml-3 text-xs text-[#858c96]">{d.updateTime}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#22252a]">已发布文章</h3>
              <button onClick={() => router.push('/articles')} className="text-sm text-[#858c96] hover:text-[#22252a]">查看全部</button>
            </div>
            {loading ? (
              <p className="text-sm text-[#858c96]">加载中...</p>
            ) : articles.length === 0 ? (
              <p className="text-sm text-[#858c96]">暂无文章</p>
            ) : (
              <div className="grid gap-3">
                {articles.map(a => (
                  <button key={a.articleId} onClick={() => router.push(`/articles/${a.articleId}`)} className="workspace-panel rounded-[14px] p-4 text-left">
                    <span className="text-sm font-medium text-[#22252a]">{a.title}</span>
                    <span className="ml-3 text-xs text-[#858c96]">{a.publishTime} · {a.viewCount} 阅读</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
