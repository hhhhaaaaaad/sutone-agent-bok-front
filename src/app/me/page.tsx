'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import { articlesApi } from '@/api/articles';
import type { DraftPageItem } from '@/types/draft';
import type { ArticlePageItem } from '@/types/article';

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [drafts, setDrafts] = useState<DraftPageItem[]>([]);
  const [articles, setArticles] = useState<ArticlePageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo?.user) { router.push('/login'); return; }
    setUser(userInfo.user);

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
  }, [router]);

  const handleLogout = () => {
    clearUserInfo();
    router.push('/login');
  };

  return (
    <div className="min-h-screen theme-bg-gradient">
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-800 text-sm">&larr; 首页</button>
          <h1 className="text-lg font-bold text-slate-800">个人中心</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-red-500">退出登录</button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* User card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
              {user.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user}</h2>
              <p className="text-sm text-slate-500">创作爱好者</p>
            </div>
          </div>
        </div>

        {/* Recent Drafts */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">最近草稿</h3>
            <button onClick={() => router.push('/drafts')} className="text-sm text-emerald-600 hover:underline">查看全部</button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">加载中...</p>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-slate-400">暂无草稿</p>
          ) : (
            <div className="grid gap-3">
              {drafts.map(d => (
                <div key={d.draftId} onClick={() => router.push(`/drafts/${d.draftId}`)}
                  className="cursor-pointer bg-white/60 rounded-xl p-4 border border-slate-200/60 hover:border-emerald-300 transition-colors">
                  <span className="font-medium text-slate-700 text-sm">{d.title || '未命名草稿'}</span>
                  <span className="ml-3 text-xs text-slate-400">{d.updateTime}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Articles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">已发布文章</h3>
            <button onClick={() => router.push('/articles')} className="text-sm text-emerald-600 hover:underline">查看全部</button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">加载中...</p>
          ) : articles.length === 0 ? (
            <p className="text-sm text-slate-400">暂无文章</p>
          ) : (
            <div className="grid gap-3">
              {articles.map(a => (
                <div key={a.articleId} onClick={() => router.push(`/articles/${a.articleId}`)}
                  className="cursor-pointer bg-white/60 rounded-xl p-4 border border-slate-200/60 hover:border-emerald-300 transition-colors">
                  <span className="font-medium text-slate-700 text-sm">{a.title}</span>
                  <span className="ml-3 text-xs text-slate-400">{a.publishTime} · {a.viewCount} 阅读</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
