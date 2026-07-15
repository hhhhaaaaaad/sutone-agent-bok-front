'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardOverview, TrendDataPoint } from '@/types/dashboard';
import WorkspaceHeader from '@/components/WorkspaceHeader';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS: Record<string, string> = {
  likes: '#3b82f6',
  favorites: '#f59e0b',
  comments: '#10b981',
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const info = getUserInfo();
    if (!info) { router.push('/login'); return; }
    setUserName(info.user);
    (async () => {
      try {
        const [overviewResp, trendResp] = await Promise.all([
          dashboardApi.overview(),
          dashboardApi.trend(7),
        ]);
        setData(overviewResp.data);
        setTrend(trendResp.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [router]);

  const handleLogout = () => { clearUserInfo(); router.push('/login'); };

  const stats = [
    { label: '文章数', value: data?.articleCount || 0 },
    { label: '总阅读', value: data?.totalViews || 0 },
    { label: '总点赞', value: data?.totalLikes || 0 },
    { label: '总收藏', value: data?.totalFavorites || 0 },
    { label: '总评论', value: data?.totalComments || 0 },
  ];

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[1280px] flex-col overflow-hidden">
        <WorkspaceHeader activePath="/dashboard" userName={userName} onLogout={handleLogout} />
        <header className="border-b border-[#e6e2db] px-5 py-4 md:px-7">
          <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">工作区 / 数据仪表盘</p>
          <h1 className="mt-1 text-[32px] font-semibold tracking-tight text-[#22252a]">数据仪表盘</h1>
        </header>
        <main className="px-5 py-8 md:px-7 space-y-10">
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">加载中...</p>
          ) : (
            <>
              {/* 总览卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.map((s) => (
                  <div key={s.label} className="workspace-panel rounded-[16px] p-5 text-center">
                    <p className="text-3xl font-bold text-[#22252a]">{s.value.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1 tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* 趋势折线图 */}
              {trend.length > 0 && (
                <div className="workspace-panel rounded-[16px] p-6">
                  <h3 className="text-sm font-semibold text-[#22252a] mb-4">近 7 天互动趋势</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e6e2db" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#858c96' }}
                        tickFormatter={(v: string) => v.slice(5)}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#858c96' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e6e2db', fontSize: 12 }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        formatter={(v: string) => ({ likes: '点赞', favorites: '收藏', comments: '评论' })[v] || v}
                      />
                      <Line type="monotone" dataKey="likes" stroke={COLORS.likes} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="favorites" stroke={COLORS.favorites} strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="comments" stroke={COLORS.comments} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
