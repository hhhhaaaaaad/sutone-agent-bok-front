'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import type { DraftPageItem } from '@/types/draft';

export default function DraftsPage() {
  const router = useRouter();
  const [currentUser] = useState(() => getUserInfo()?.user || '');
  const [drafts, setDrafts] = useState<DraftPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

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

  useEffect(() => {
    const user = getUserInfo();
    if (!user?.user) { router.push('/login'); return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDrafts]);

  const visibleDrafts = drafts.slice(0, 8);
  const collections = [
    { title: '正在编辑', count: drafts.filter((item) => item.status === 0).length },
    { title: '可发布', count: drafts.filter((item) => item.status === 1).length },
    { title: '已废弃', count: drafts.filter((item) => item.status === 2).length },
  ];

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto grid min-h-[calc(100vh-40px)] max-w-[1180px] grid-cols-1 overflow-hidden xl:grid-cols-[248px_1fr]">
        <aside className="workspace-sidebar flex flex-col gap-5 px-5 py-6">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-[#22252a]">草稿列表</h1>
            <p className="workspace-mono mt-1 text-[11px] tracking-[0.16em] text-[#858c96]">
              稿件工作区
            </p>
          </div>

          <div className="space-y-2">
            {[
              { label: '返回首页', path: '/' },
              { label: '当前草稿', path: '/drafts' },
              { label: '文章广场', path: '/articles' },
            ].map((item, index) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex h-[42px] w-full items-center rounded-[8px] px-4 text-left text-sm ${
                  index === 1 ? 'border border-[#e6e2db] bg-white text-[#22252a]' : 'text-[#5d636c] hover:bg-white/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">草稿分组</p>
            <div className="mt-3 space-y-3">
              {collections.map((group) => (
                <div key={group.title} className="flex items-center justify-between rounded-[10px] bg-[#fcfbf8] px-3 py-2 text-sm text-[#22252a]">
                  <span>{group.title}</span>
                  <span className="text-[#858c96]">{group.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto text-xs text-[#5d636c]">
            <p className="font-medium text-[#22252a]">{currentUser || '当前用户'}</p>
            <p className="mt-1">最近草稿会自动同步到写作工作区。</p>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-[#fcfbf8]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e2db] px-5 py-4 md:px-7">
            <div>
              <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">工作区 / 草稿列表</p>
              <h2 className="mt-1 text-[34px] font-semibold tracking-tight text-[#22252a]">继续整理你的稿件</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={loadDrafts} className="workspace-secondary-btn px-4 py-2.5 text-sm font-medium">
                刷新列表
              </button>
              <button onClick={handleNewDraft} className="workspace-primary-btn px-4 py-2.5 text-sm font-medium">
                新建草稿
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 md:p-6">
            {loading && <p className="py-12 text-center text-sm text-[#858c96]">草稿加载中...</p>}
            {error && (
              <div className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
                <button onClick={loadDrafts} className="ml-3 underline">重试</button>
              </div>
            )}

            {!loading && !error && drafts.length === 0 && (
              <div className="workspace-panel rounded-[16px] p-8 text-center">
                <p className="text-sm text-[#858c96]">当前还没有草稿内容。</p>
                <button onClick={handleNewDraft} className="workspace-primary-btn mt-5 px-5 py-2.5 text-sm font-medium">
                  创建第一篇草稿
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {visibleDrafts.map((draft) => (
                <button
                  key={draft.draftId}
                  onClick={() => router.push(`/drafts/${draft.draftId}`)}
                  className="workspace-panel flex w-full items-center justify-between gap-4 rounded-[16px] p-5 text-left transition-colors hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[28px] font-medium tracking-tight text-[#22252a]">
                      {draft.title || '未命名草稿'}
                    </p>
                    <p className="mt-2 truncate text-sm text-[#5d636c]">
                      {draft.summary || '暂无摘要，等待进一步整理与补充。'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#858c96]">
                      <span className="workspace-status">{draft.statusDesc || '编辑中'}</span>
                      <span>{draft.updateTime || '刚刚更新'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {draft.status === 0 && (
                      <span
                        onClick={(e) => { e.stopPropagation(); handleDiscard(draft.draftId); }}
                        className="workspace-secondary-btn cursor-pointer px-3 py-2 text-xs font-medium text-[#858c96] hover:text-red-500"
                      >
                        废弃
                      </span>
                    )}
                    <span className="text-sm text-[#858c96]">进入</span>
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
