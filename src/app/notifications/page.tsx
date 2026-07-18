'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { notificationApi } from '@/api/notification';
import type { NotificationPageResponse } from '@/types/notification';
import WorkspaceHeader from '@/components/WorkspaceHeader';

export default function NotificationsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [list, setList] = useState<NotificationPageResponse['list']>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = async (p: number) => {
    setLoading(true);
    try {
      const resp = await notificationApi.list(p);
      setList(resp.data?.list || []);
      setTotal(resp.data?.total || 0);
      setPage(resp.data?.page || p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const info = getUserInfo();
    if (!info) { router.push('/login'); return; }
    setUserName(info.user);
    fetchData(1);
  }, [router]);

  const handleLogout = () => {
    clearUserInfo();
    router.push('/login');
  };

  const handleMarkRead = async (id: number) => {
    try { await notificationApi.markRead(id); fetchData(page); } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try { await notificationApi.markAllRead(); fetchData(1); } catch { /* ignore */ }
  };

  const totalPages = Math.max(1, Math.ceil(total / 10));

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto max-w-[780px] overflow-hidden bg-[#fcfbf8]">
        <WorkspaceHeader activePath="/notifications" userName={userName} onLogout={handleLogout} />
        <header className="border-b border-[#e6e2db] flex items-center justify-between px-5 py-4 md:px-7">
          <h2 className="text-lg font-semibold text-[#22252a]">通知</h2>
          {total > 0 && (
            <button onClick={handleMarkAllRead} className="text-sm text-blue-500 hover:underline">全部已读</button>
          )}
        </header>
        <main className="px-5 py-4 md:px-7">
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">加载中...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">暂无通知</p>
          ) : (
            <div className="space-y-1">
              {list.map((item) => (
                <div
                  key={item.id}
                  onClick={() => { if (!item.isRead) handleMarkRead(item.id); }}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    item.isRead ? 'hover:bg-[#f5f3ef]' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#3f444b]">{item.content}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.createTime}</p>
                  </div>
                  {!item.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6 text-sm text-slate-500">
              <button disabled={page <= 1} onClick={() => fetchData(page - 1)} className="hover:text-slate-700 disabled:opacity-30">上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => fetchData(page + 1)} className="hover:text-slate-700 disabled:opacity-30">下一页</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
