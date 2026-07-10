'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import type { DraftPageItem } from '@/types/draft';
import WorkspaceHeader from '@/components/WorkspaceHeader';

type FilterKey = 'all' | 'editing' | 'ready' | 'archived';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '全部草稿' },
  { key: 'editing', label: '编辑中' },
  { key: 'ready', label: '待发布' },
  { key: 'archived', label: '已归档' },
];

export default function DraftsPage() {
  const router = useRouter();
  const [currentUser] = useState(() => getUserInfo()?.user || '');
  const [drafts, setDrafts] = useState<DraftPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await draftsApi.page(1, 20);
      setDrafts(resp.data.list ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载草稿失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getUserInfo();
    if (!user?.user) {
      router.push('/login');
      return;
    }
    loadDrafts();
  }, [loadDrafts, router]);

  const handleNewDraft = async () => {
    try {
      const resp = await draftsApi.save({ title: '未命名草稿', contentMd: '' });
      router.push(`/drafts/${resp.data.draftId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建草稿失败');
    }
  };

  const handleDiscard = async (draftId: number) => {
    if (!confirm('确定废弃这篇草稿？')) return;
    try {
      await draftsApi.discard(draftId);
      setDrafts((prev) =>
        prev.map((draft) =>
          draft.draftId === draftId
            ? { ...draft, status: 2, statusDesc: '已废弃' }
            : draft,
        ),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  const filteredDrafts = drafts.filter((draft) => {
    if (activeFilter === 'editing') return draft.status === 0;
    if (activeFilter === 'ready') return draft.status === 1;
    if (activeFilter === 'archived') return draft.status === 2;
    return true;
  });

  const featured = filteredDrafts[0] ?? drafts[0];
  const rightRailDrafts = drafts.slice(0, 3);
  const collectionStats = [
    { label: '编辑中', value: drafts.filter((item) => item.status === 0).length },
    { label: '待发布', value: drafts.filter((item) => item.status === 1).length },
    { label: '已归档', value: drafts.filter((item) => item.status === 2).length },
  ];

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[1280px] flex-col overflow-hidden">
        <WorkspaceHeader activePath="/drafts" userName={currentUser} />
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="workspace-sidebar-soft flex flex-col gap-5 px-5 py-6">
          <div>
            <p className="workspace-mono text-[11px] tracking-[0.16em] text-[#858c96]">草稿工作区</p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[#22252a]">项目概览</h2>
          </div>

          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">草稿统计</p>
            <div className="mt-3 space-y-3">
              {collectionStats.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[10px] bg-[#fcfbf8] px-3 py-2 text-sm text-[#22252a]"
                >
                  <span>{item.label}</span>
                  <span className="text-[#858c96]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto text-xs text-[#5d636c]">
            <p className="font-medium text-[#22252a]">{currentUser || '当前用户'}</p>
            <p className="mt-1">草稿会和编辑器、发布记录保持同一套节奏与层级。</p>
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-[#fcfbf8]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e2db] px-5 py-4 md:px-7">
            <div>
              <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">工作区 / 草稿列表</p>
              <h2 className="mt-1 text-[34px] font-semibold tracking-tight text-[#22252a]">继续整理你的写作项目</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input className="workspace-search w-[180px]" placeholder="按标题或状态搜索" />
              <button onClick={loadDrafts} className="workspace-secondary-btn px-4 py-2.5 text-sm font-medium">
                刷新
              </button>
              <button onClick={handleNewDraft} className="workspace-primary-btn px-4 py-2.5 text-sm font-medium">
                新建草稿
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#ece7df] pb-4">
              {FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className={`workspace-toolbar-chip ${
                    activeFilter === filter.key ? 'border-[#d8d3cc] bg-[#f6f2ec] text-[#22252a]' : ''
                  }`}
                >
                  {filter.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-[#858c96]">{filteredDrafts.length} 篇文档</span>
            </div>

            {error && (
              <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {featured && (
              <div className="workspace-subpanel mt-5 rounded-[14px] p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-[#858c96]">当前选中草稿</p>
                    <h3 className="mt-2 text-[24px] font-medium tracking-tight text-[#22252a]">
                      {featured.title || '未命名草稿'}
                    </h3>
                    <p className="mt-2 max-w-[58ch] text-sm leading-6 text-[#5d636c]">
                      {featured.summary || '这篇草稿仍在推进中，适合继续补完结构、润色段落与发布信息。'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/drafts/${featured.draftId}`)}
                    className="workspace-secondary-btn px-4 py-2 text-sm font-medium"
                  >
                    打开草稿
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-4">
              {loading ? (
                <p className="py-16 text-center text-sm text-[#858c96]">草稿加载中...</p>
              ) : filteredDrafts.length === 0 ? (
                <div className="workspace-panel rounded-[16px] p-8 text-center text-sm text-[#858c96]">
                  当前筛选条件下没有草稿。
                </div>
              ) : (
                filteredDrafts.map((draft) => (
                  <button
                    key={draft.draftId}
                    onClick={() => router.push(`/drafts/${draft.draftId}`)}
                    className="workspace-panel workspace-panel-hover flex w-full items-center justify-between gap-4 rounded-[16px] p-5 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="truncate text-[22px] font-medium tracking-tight text-[#22252a]">
                          {draft.title || '未命名草稿'}
                        </p>
                        <span className={`workspace-status ${draft.status === 1 ? 'success' : ''}`}>
                          {draft.statusDesc || '编辑中'}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm text-[#5d636c]">
                        {draft.summary || '暂无摘要，等待继续补充正文与发布设置。'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#858c96]">
                        <span>{draft.updateTime || '刚刚更新'}</span>
                        <span>{draft.status === 0 ? '待润色' : draft.status === 1 ? '待发布' : '已归档'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {draft.status === 0 && (
                        <span
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDiscard(draft.draftId);
                          }}
                          className="workspace-secondary-btn cursor-pointer px-3 py-2 text-xs font-medium text-[#858c96] hover:text-red-500"
                        >
                          废弃
                        </span>
                      )}
                      <span className="text-sm text-[#858c96]">打开</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </main>

        <aside className="workspace-right-rail hidden xl:flex xl:flex-col xl:gap-5 xl:px-5 xl:py-6">
          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">最近动态</p>
            <div className="mt-3 space-y-3">
              {rightRailDrafts.length === 0 ? (
                <p className="text-sm text-[#858c96]">暂无最近变更。</p>
              ) : (
                rightRailDrafts.map((draft) => (
                  <div key={draft.draftId} className="workspace-subpanel rounded-[10px] p-3">
                    <p className="text-sm font-medium text-[#22252a]">{draft.title || '未命名草稿'}</p>
                    <p className="mt-2 text-xs leading-5 text-[#858c96]">{draft.updateTime || '刚刚更新'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">快捷操作</p>
            <div className="mt-3 space-y-2">
              <button onClick={handleNewDraft} className="workspace-primary-btn h-10 w-full text-sm font-medium">
                打开编辑器
              </button>
              <button onClick={() => router.push('/articles')} className="workspace-secondary-btn h-10 w-full text-sm font-medium">
                查看已发布文章
              </button>
              <button onClick={() => router.push('/me')} className="workspace-secondary-btn h-10 w-full text-sm font-medium">
                前往个人中心
              </button>
            </div>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}
