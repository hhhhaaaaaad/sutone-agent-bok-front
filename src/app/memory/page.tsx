'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { memoryApi } from '@/api/memory';
import type { MemoryItem } from '@/types/memory';
import { relativeTime } from '@/utils/time';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import Pagination from '@/components/Pagination';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  fact:       { label: '事实', color: 'text-blue-600', bg: 'bg-blue-50' },
  preference: { label: '偏好', color: 'text-green-600', bg: 'bg-green-50' },
  knowledge:  { label: '知识', color: 'text-purple-600', bg: 'bg-purple-50' },
  event:      { label: '事件', color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function MemoryPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [toast, setToast] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadList = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    try {
      const data = await memoryApi.list(p, ps);
      setItems(data.items);
      setTotal(data.total);
      setPage(data.page);
    } catch (e) {
      setToast(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const info = getUserInfo();
    if (!info) { router.push('/login'); return; }
    setUserName(info.user);
    loadList(1, pageSize);
  }, [router, loadList, pageSize]);

  const handleLogout = () => { clearUserInfo(); router.push('/login'); };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setSearchMode(false);
      loadList(1, pageSize);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      setSearchMode(true);
      setLoading(true);
      try {
        const data = await memoryApi.search(value, 10);
        setItems(data.items);
        setTotal(data.total);
      } catch (e) {
        setToast(e instanceof Error ? e.message : '搜索失败');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleDelete = async (id: number, content: string) => {
    if (!window.confirm(`确定删除记忆"${content.slice(0, 30)}..."吗？`)) return;
    try {
      await memoryApi.delete(id);
      setToast('已删除');
      if (searchMode) {
        handleSearchChange(searchQuery);
      } else {
        loadList(page, pageSize);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : '删除失败');
    }
  };

  const handlePageChange = (p: number, ps: number) => {
    setPageSize(ps);
    loadList(p, ps);
  };

  const getTypeChip = (type: string) => {
    const cfg = TYPE_CONFIG[type] || { label: type, color: 'text-gray-600', bg: 'bg-gray-50' };
    return (
      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.color} ${cfg.bg}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[960px] flex-col overflow-hidden">
        <WorkspaceHeader activePath="/memory" userName={userName} onLogout={handleLogout} />
        <header className="border-b border-[#e6e2db] px-5 py-4 md:px-7">
          <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">MEMORY</p>
          <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-[#22252a]">记忆管理</h1>
        </header>
        <main className="px-5 py-8 md:px-7 flex-1">
          {/* 搜索栏 */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索记忆..."
                className="w-full rounded-[10px] border border-[#e6e2db] bg-white px-3 py-2 text-sm text-[#22252a] outline-none placeholder:text-[#b9b2a8]"
                aria-label="搜索记忆"
                role="searchbox"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchMode(false); loadList(1, pageSize); }}
                className="rounded-[10px] border border-[#e6e2db] px-3 py-2 text-xs text-[#858c96] hover:bg-[#f7f5f2] transition">
                清除
              </button>
            )}
          </div>

          {/* 状态栏 */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#858c96]">
              {searchMode ? `搜索 "..." 共 ${total} 条结果` : `共 ${total} 条记忆`}
            </p>
            <button
              onClick={() => loadList(page, pageSize)}
              disabled={loading}
              className="text-xs text-[#858c96] hover:text-[#567260] transition disabled:opacity-40">
              刷新
            </button>
          </div>

          {/* 记忆列表 */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-12 text-sm text-[#b9b2a8]">加载中...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[#b9b2a8]">暂无记忆</p>
                <p className="text-xs text-[#b9b2a8] mt-1">和 AI 对话后会自动提取记忆</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id}
                  className="workspace-panel rounded-[12px] px-4 py-3 flex items-center gap-3 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeChip(item.type)}
                      {searchMode && item.score != null && (
                        <span className="text-[10px] text-[#858c96]">匹配 {item.score.toFixed(2)}</span>
                      )}
                    </div>
                    <p className="text-sm text-[#22252a] truncate">{item.content}</p>
                    <p className="text-[10px] text-[#b9b2a8] mt-1">
                      {item.importance != null && `重要性 ${item.importance.toFixed(2)}`}
                      {item.accessCount != null && ` · 访问 ${item.accessCount} 次`}
                      {item.createTime && ` · ${relativeTime(item.createTime)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id, item.content)}
                    className="shrink-0 text-[10px] text-[#c4beb5] hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    aria-label={`删除记忆: ${item.content.slice(0, 20)}`}>
                    删除
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 分页（仅列表模式） */}
          {!searchMode && total > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                pageNo={page}
                pageSize={pageSize}
                total={total}
                pageSizeOptions={[10, 20, 50]}
                onChange={handlePageChange}
              />
            </div>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[10px] bg-[#22252a] px-4 py-2 text-xs text-white shadow-lg z-50"
            onAnimationEnd={() => setToast('')}>
            {toast}
            <style>{`@keyframes fadeOut { 0%,80%{opacity:1} 100%{opacity:0} }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}
