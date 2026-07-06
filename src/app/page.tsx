'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, clearUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import { articlesApi } from '@/api/articles';
import type { DraftPageItem } from '@/types/draft';
import type { ArticlePageItem } from '@/types/article';

export default function Lobby() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState('');
  const [recentDrafts, setRecentDrafts] = useState<DraftPageItem[]>([]);
  const [recentArticles, setRecentArticles] = useState<ArticlePageItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.user) {
      router.push('/login');
      return;
    }
    setCurrentUser(userInfo.user);

    (async () => {
      try {
        const [dResp, aResp] = await Promise.all([
          draftsApi.page(1, 5),
          articlesApi.page(1, 5),
        ]);
        setRecentDrafts(dResp.data.list ?? []);
        setRecentArticles(aResp.data.list ?? []);
      } catch { /* ignore fetch errors on home page */ }
      setDataLoading(false);
    })();
  }, [router]);

  const handleLogout = () => {
    clearUserInfo();
    router.push('/login');
  };

  const handleNewDraft = async () => {
    try {
      const resp = await draftsApi.save({ title: '未命名草稿', contentMd: '' });
      router.push(`/drafts/${resp.data.draftId}`);
    } catch {
      router.push('/drafts');
    }
  };

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

          {/* Workspace Cards - AI Writing as Primary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI 写文章 - Primary */}
            <button
              onClick={handleNewDraft}
              className="md:col-span-1 group relative text-left p-7 rounded-[24px] border-2 border-emerald-300/60 bg-white/90 backdrop-blur-sm hover:bg-white hover:border-emerald-400 hover:shadow-[0_12px_32px_rgba(16,185,129,0.15)] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%)]" />
              <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-full shadow-sm">主入口</span>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">AI 写文章</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">AI 辅助创作技术文章，支持大纲生成、正文续写、润色改写，Markdown 编辑器实时预览。</p>
              <div className="flex flex-wrap gap-2">
                {['AI 写作', 'Markdown', '自动保存', '一键发布'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">{tag}</span>
                ))}
              </div>
            </button>

            {/* Draw.io */}
            <button
              onClick={() => router.push('/drawio')}
              className="group relative text-left p-7 rounded-[24px] border border-slate-200/80 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-emerald-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.03),transparent_28%)]" />
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">Draw.io 绘图</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">AI + Draw.io，交互式对话完成流程图、架构图、UML 等绘制。</p>
              <div className="flex flex-wrap gap-2">
                {['流程图', '架构图', 'UML', '时序图'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-50 text-slate-500 border border-slate-100">{tag}</span>
                ))}
              </div>
            </button>

            {/* PPT */}
            <button
              onClick={() => router.push('/ppt')}
              className="group relative text-left p-7 rounded-[24px] border border-slate-200/80 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-indigo-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent_28%)]" />
              <span className="absolute top-4 right-4 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-sm">NEW</span>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">PPT 生成</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">AI + PptxGenJS，对话式生成专业 PowerPoint 演示文稿。</p>
              <div className="flex flex-wrap gap-2">
                {['汇报', '培训', '方案', '总结'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] rounded-md bg-slate-50 text-slate-500 border border-slate-100">{tag}</span>
                ))}
              </div>
            </button>
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

          {/* Recent Drafts & Articles */}
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">最近草稿</h2>
              <button onClick={() => router.push('/drafts')} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">查看全部 &rarr;</button>
            </div>
            {dataLoading ? (
              <p className="text-sm text-slate-400">加载中...</p>
            ) : recentDrafts.length === 0 ? (
              <p className="text-sm text-slate-400">暂无草稿，点击"AI 写文章"开始创作</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentDrafts.map((draft) => (
                  <div key={draft.draftId} onClick={() => router.push(`/drafts/${draft.draftId}`)}
                    className="group cursor-pointer rounded-xl border border-slate-200/60 bg-white/60 hover:bg-white hover:border-slate-300 shadow-sm hover:shadow transition-all overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center border-b border-slate-100">
                      <svg className="w-8 h-8 text-emerald-300 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-slate-800 truncate">{draft.title || '未命名'}</h4>
                      <span className="text-[10px] text-slate-400 mt-1 block">{draft.updateTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-12 mb-6">
              <h2 className="text-xl font-bold text-slate-800">最近发布</h2>
              <button onClick={() => router.push('/articles')} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">查看全部 &rarr;</button>
            </div>
            {dataLoading ? (
              <p className="text-sm text-slate-400">加载中...</p>
            ) : recentArticles.length === 0 ? (
              <p className="text-sm text-slate-400">暂无文章</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentArticles.map((article) => (
                  <div key={article.articleId} onClick={() => router.push(`/articles/${article.articleId}`)}
                    className="group cursor-pointer rounded-xl border border-slate-200/60 bg-white/60 hover:bg-white hover:border-slate-300 shadow-sm hover:shadow transition-all overflow-hidden">
                    <div className="h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border-b border-slate-100">
                      <svg className="w-8 h-8 text-indigo-300 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                      </svg>
                    </div>
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-slate-800 truncate">{article.title}</h4>
                      <span className="text-[10px] text-slate-400 mt-1 block">{article.publishTime} · {article.viewCount} 阅读</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
