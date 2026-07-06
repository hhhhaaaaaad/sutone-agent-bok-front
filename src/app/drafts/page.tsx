'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import type { DraftPageItem } from '@/types/draft';

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getUserInfo();
    if (!user?.user) { router.push('/login'); return; }
    loadDrafts();
  }, [router]);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await draftsApi.page(1, 20);
      setDrafts(resp.data.list ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewDraft = async () => {
    try {
      const resp = await draftsApi.save({ title: '未命名草稿', contentMd: '' });
      router.push(`/drafts/${resp.data.draftId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败');
    }
  };

  const handleDiscard = async (draftId: number) => {
    if (!confirm('确定废弃该草稿？')) return;
    try {
      await draftsApi.discard(draftId);
      setDrafts(prev => prev.map(d => d.draftId === draftId ? { ...d, status: 2, statusDesc: '已废弃' } : d));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <div className="min-h-screen theme-bg-gradient">
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-800 text-sm">&larr; 返回</button>
          <h1 className="text-lg font-bold text-slate-800">草稿箱</h1>
        </div>
        <button
          onClick={handleNewDraft}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-shadow"
        >
          + 新建草稿
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading && <p className="text-slate-500 text-center mt-20">加载中...</p>}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
            <button onClick={loadDrafts} className="ml-3 underline">重试</button>
          </div>
        )}

        {!loading && !error && drafts.length === 0 && (
          <div className="text-center mt-24">
            <p className="text-slate-400 mb-4">还没有草稿</p>
            <button onClick={handleNewDraft} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm">
              创建第一篇草稿
            </button>
          </div>
        )}

        <div className="grid gap-4">
          {drafts.map(draft => (
            <div
              key={draft.draftId}
              onClick={() => router.push(`/drafts/${draft.draftId}`)}
              className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-800 truncate">
                  {draft.title || '未命名草稿'}
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {draft.summary || '暂无摘要'}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    draft.status === 0 ? 'bg-blue-50 text-blue-600' :
                    draft.status === 1 ? 'bg-emerald-50 text-emerald-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {draft.statusDesc}
                  </span>
                  <span className="text-xs text-slate-400">{draft.updateTime}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {draft.status === 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDiscard(draft.draftId); }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    废弃
                  </button>
                )}
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
