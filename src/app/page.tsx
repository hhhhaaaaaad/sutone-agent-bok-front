'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';

export default function Lobby() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.user) {
      router.push('/login');
      return;
    }
    setCurrentUser(userInfo.user);
  }, [router]);

  const handleLogout = () => {
    clearUserInfo();
    router.push('/login');
  };

  const historyWorks = [
    {
      id: '1',
      title: '电商系统微服务架构图',
      type: 'drawio',
      tags: ['架构图', '微服务'],
      updatedAt: '10 分钟前',
      bg: 'bg-gradient-to-br from-blue-500/20 to-purple-500/20',
      icon: (
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      id: '2',
      title: 'Q3季度研发总结汇报',
      type: 'ppt',
      tags: ['总结', '数据'],
      updatedAt: '2 小时前',
      bg: 'bg-gradient-to-br from-orange-500/20 to-red-500/20',
      icon: (
        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: '3',
      title: '用户登录注册时序图',
      type: 'drawio',
      tags: ['时序图', '业务'],
      updatedAt: '昨天',
      bg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20',
      icon: (
        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      )
    },
    {
      id: '4',
      title: '新人入职培训课件',
      type: 'ppt',
      tags: ['培训', '企业文化'],
      updatedAt: '3天前',
      bg: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20',
      icon: (
        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  const workspaces = [
    {
      id: 'drawio',
      title: 'Draw.io 绘图',
      desc: 'AI + Draw.io，交互式对话完成流程图、架构图、UML 等绘制',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="9" y1="21" x2="9" y2="9"></line>
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-200',
      bgHover: 'hover:border-emerald-300',
      href: '/drawio',
      tags: ['流程图', '架构图', 'UML', '时序图'],
    },
    {
      id: 'ppt',
      title: 'PPT 生成',
      desc: 'AI + PptxGenJS，对话式生成专业 PowerPoint 演示文稿',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      gradient: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-indigo-200',
      bgHover: 'hover:border-indigo-300',
      href: '/ppt',
      tags: ['汇报', '培训', '方案', '总结'],
      badge: 'NEW',
    },
  ];

  const communityHighlights = [
    { label: '创作模式', value: '2', hint: '图表 + 演示文稿' },
    { label: '最近灵感', value: '12', hint: '可继续追写与迭代' },
    { label: '协作节奏', value: '24h', hint: '持续产出内容资产' },
  ];

  const creatorSignals = [
    { title: '更像创作台', desc: '把写作、绘图、演示统一收口在同一套工作流里。' },
    { title: '更有展示感', desc: '首页和入口页采用更完整的视觉层级，不再是简单工具列表。' },
    { title: '更适合扩展', desc: '后续可以直接叠加封面生成、文章发布、社区互动等能力。' },
  ];

  return (
    <div className="premium-shell premium-grid min-h-screen flex flex-col theme-bg-gradient">
      {/* Header */}
      <header className="h-20 px-8 flex items-center justify-between border-b border-slate-200/60 shrink-0 relative z-10 bg-white/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[14px] grid place-items-center bg-gradient-to-br from-[#67e8f9] via-[#7c3aed] to-[#22c55e] shadow-[0_8px_16px_rgba(124,58,237,0.2)] text-white font-extrabold text-sm tracking-[0.14em]">
            SM
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">AI Bok 创作社区Sutmuch</h1>
            <p className="text-[11px] text-slate-500">创作、结构化表达与内容沉淀的一体化工作台</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://sukesutone.cn/md/project/ai-agent-scaffold/ai-agent-scaffold.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white/60 hover:bg-white rounded-lg transition-colors border border-slate-200 hover:border-slate-300 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            社区指南
          </a>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-xs font-medium text-slate-600">{currentUser}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
          >
            退出登录
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative z-10">
        <div className="max-w-4xl w-full">
          <div className="glass-panel-dark rounded-[28px] px-8 py-8 mb-10 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-medium text-white/70 mb-4">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  Sutmuch Creative Workspace
                </div>
                <h2 className="text-4xl font-bold text-white tracking-tight leading-[1.15]">
                  面向创作者的 AI Bok 创作<br/>社区Sutmuch
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/70 max-w-xl">
                  在一个界面里完成图表构思、演示表达和内容资产沉淀。视觉上更克制，信息层级更清楚，也更接近真正可长期演进的创作平台。
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[360px]">
                {communityHighlights.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">{item.label}</div>
                    <div className="mt-2 text-2xl font-bold text-white">{item.value}</div>
                    <div className="mt-1 text-[11px] text-white/50 leading-5">{item.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workspace Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => router.push(ws.href)}
                className={`
                  group relative text-left p-7 rounded-[24px] border border-slate-200/80
                  bg-white/80 backdrop-blur-sm
                  hover:bg-white
                  ${ws.bgHover} hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]
                  transition-all duration-300 cursor-pointer overflow-hidden
                `}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.03),transparent_28%)]" />
                {/* Badge */}
                {ws.badge && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-sm">
                    {ws.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${ws.gradient} flex items-center justify-center text-white shadow-lg ${ws.shadow} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {ws.icon}
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                  {ws.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  {ws.desc}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {ws.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[11px] rounded-md bg-slate-50 text-slate-500 border border-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {creatorSignals.map((item) => (
              <div key={item.title} className="glass-panel-dark rounded-2xl px-5 py-5 border border-slate-200/5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">Sutmuch</div>
                <h3 className="mt-3 text-base font-semibold text-white/90">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* History Works */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">最近创作</h2>
              <button className="text-sm text-slate-500 hover:text-slate-800 transition-colors">查看全部 &rarr;</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {historyWorks.map((work) => (
                <div 
                  key={work.id}
                  onClick={() => router.push(`/${work.type}?id=${work.id}`)}
                  className="group cursor-pointer rounded-xl border border-slate-200/60 bg-white/60 hover:bg-white hover:border-slate-300 shadow-sm hover:shadow transition-all overflow-hidden"
                >
                  {/* Thumbnail area */}
                  <div className={`h-32 ${work.bg} flex items-center justify-center border-b border-slate-100 relative`}>
                    <div className="group-hover:scale-110 transition-transform duration-500">
                      {work.icon}
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-slate-700 shadow-sm border border-slate-200">
                        点击打开
                      </span>
                    </div>
                  </div>
                  
                  {/* Info area */}
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-slate-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                      {work.title}
                    </h4>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        {work.tags.slice(0, 1).map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {work.updatedAt}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer hint */}
          <p className="text-center text-[11px] text-slate-400 mt-16">
            AI Bok 创作社区Sutmuch · 更完整的创作入口正在持续接入
          </p>
        </div>
      </main>
    </div>
  );
}
