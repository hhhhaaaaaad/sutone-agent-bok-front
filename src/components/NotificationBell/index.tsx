'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationApi } from '@/api/notification';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const router = useRouter();
  const initialTimerRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const resp = await notificationApi.unreadCount();
      setUnread(resp.data?.unreadCount || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    initialTimerRef.current = window.setTimeout(() => { void fetchUnread(); }, 0);
    timerRef.current = window.setInterval(() => { void fetchUnread(); }, 30000);
    return () => {
      if (initialTimerRef.current !== null) window.clearTimeout(initialTimerRef.current);
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [fetchUnread]);

  return (
    <button
      type="button"
      onClick={() => { router.push('/notifications'); }}
      className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
      title="通知"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
