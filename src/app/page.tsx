"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserInfo, clearUserInfo } from "@/utils/cookie";
import { draftsApi } from "@/api/drafts";
import { articlesApi } from "@/api/articles";
import type { DraftPageItem } from "@/types/draft";
import type { ArticlePageItem } from "@/types/article";
import WordGravity from "./login/WordGravity";
import WorkspaceHeader from "@/components/WorkspaceHeader";

const HOME_WORKSPACE_WORDS = [
  "Focus",
  "Context",
  "Continue",
  "Structure",
  "Voice",
  "Refine",
  "Create",
  "Polish",
  "Publish",
];

export default function Lobby() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState("");
  const [recentDrafts, setRecentDrafts] = useState<DraftPageItem[]>([]);
  const [recentArticles, setRecentArticles] = useState<ArticlePageItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [nowLabel, setNowLabel] = useState("");
  const fetchedRef = useRef(false);

  useEffect(() => {
    setCurrentUser(getUserInfo()?.user || "");
    setNowLabel(`${new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" })} · ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
  }, []);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.user) {
      router.push("/login");
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const [dResp, aResp] = await Promise.all([
          draftsApi.page(1, 5),
          articlesApi.page({ pageNo: 1, pageSize: 5 }),
        ]);
        setRecentDrafts(dResp.data.list ?? []);
        setRecentArticles(aResp.data.list ?? []);
      } catch {
        /* ignore fetch errors on home page */
      }
      setDataLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    clearUserInfo();
    router.push("/login");
  };

  const handleNewDraft = async () => {
    try {
      const resp = await draftsApi.save({ title: "未命名草稿", contentMd: "" });
      router.push(`/drafts/${resp.data.draftId}`);
    } catch {
      router.push("/drafts");
    }
  };

  const toolEntries = [
    { title: "大纲编排", hint: "进入", action: () => handleNewDraft() },
    {
      title: "流程绘图台",
      hint: "进入",
      action: () => router.push("/drawio"),
    },
    { title: "演示文稿台", hint: "进入", action: () => router.push("/ppt") },
    {
      title: "文章广场",
      hint: "进入",
      action: () => router.push("/articles"),
    },
  ];

  const progressPercent = Math.min(
    88,
    Math.max(24, recentDrafts.length * 18 + recentArticles.length * 10),
  );
  const activeDraft = recentDrafts[0];
  const heroSubtext =
    activeDraft?.summary ||
    "把更新最频繁、保留语气统一、结构自洽的稿件放在最前面，让写作继续在同一条脉络里推进。";
  const sessionTitle = activeDraft?.title || "长篇文章草稿";
  const sessionMeta = activeDraft?.updateTime || "已关联 12 条资料";
  const activityFeed = [
    ...recentDrafts.slice(0, 2).map((draft) => ({
      id: `draft-${draft.draftId}`,
      time: draft.updateTime || "刚刚",
      text: `${draft.title || "未命名草稿"} 已同步到草稿工作区`,
    })),
    ...recentArticles.slice(0, 2).map((article) => ({
      id: `article-${article.articleId}`,
      time: article.publishTime || "刚刚",
      text: `${article.title} 已进入文章广场`,
    })),
  ].slice(0, 4);

  const renderDraftStatus = (draft: DraftPageItem) => {
    if (draft.status === 0) return "待润色";
    if (draft.status === 1) return "可发布";
    return draft.statusDesc || "已归档";
  };

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[1280px] flex-col overflow-hidden">
        <WorkspaceHeader activePath="/" userName={currentUser} onLogout={handleLogout} />
        <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[224px_1fr]">
        <aside className="workspace-sidebar flex flex-col px-5 py-5">
          <div className="workspace-panel rounded-[12px] p-4">
            <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">
              今日安排
            </p>
            <p className="mt-3 text-sm leading-7 text-[#5d636c]">
              当前有 {recentDrafts.length || 0} 篇草稿等待最后一轮校对与发布。
            </p>
            <div className="workspace-divider my-4" />
            <div className="space-y-2 text-[13px] text-[#22252a]">
              <p>校对队列 · 09:30</p>
              <p>长文润色 · 14:00</p>
            </div>
          </div>

          <div className="workspace-subpanel mt-auto rounded-[12px] p-4 text-xs leading-6 text-[#5d636c]">
            主菜单已移动到顶部，可以在创作、草稿与发布内容之间快速切换。
          </div>
        </aside>

        <main className="flex min-h-0 flex-col bg-[#fcfbf8]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e2db] px-4 py-4 md:px-7">
            <div>
              <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">
                {nowLabel}
              </p>
              <h2 className="mt-1 text-[34px] font-semibold tracking-tight text-[#22252a]">
                继续创作
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                className="workspace-input w-[280px] max-w-full text-sm"
                placeholder="搜索草稿、工具或资料库"
              />
              <button
                onClick={handleNewDraft}
                className="workspace-primary-btn h-[42px] px-5 text-sm font-medium"
              >
                新建草稿
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_260px]">
            <section className="space-y-5">
              <div className="workspace-panel rounded-[16px] p-4 md:p-6">
                <p className="workspace-mono text-[11px] tracking-[0.16em] text-[#858c96]">
                  从上次停下的地方继续
                </p>
                <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_160px]">
                  <div>
                    <WordGravity words={HOME_WORKSPACE_WORDS} />
                    <p className="mt-4 max-w-[58ch] text-sm leading-7 text-[#5d636c]">
                      {heroSubtext}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          activeDraft
                            ? router.push(`/drafts/${activeDraft.draftId}`)
                            : handleNewDraft()
                        }
                        className="workspace-primary-btn px-4 py-2.5 text-sm font-medium"
                      >
                        {activeDraft ? "继续写作" : "新建草稿"}
                      </button>
                      <button
                        onClick={() => router.push("/drafts")}
                        className="workspace-secondary-btn px-4 py-2.5 text-sm font-medium"
                      >
                        查看草稿
                      </button>
                    </div>
                  </div>

                  <div className="workspace-subpanel flex flex-col justify-between rounded-[12px] p-4">
                    <div>
                      <p className="workspace-mono text-[11px] tracking-[0.16em] text-[#858c96]">
                        当前会话
                      </p>
                      <p className="mt-3 text-[22px] font-medium text-[#22252a]">
                        {sessionTitle}
                      </p>
                      <p className="mt-2 text-sm text-[#5d636c]">
                        {sessionMeta}
                      </p>
                      <p className="mt-2 text-sm text-[#858c96]">
                        大纲完成度 {progressPercent}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="workspace-progress">
                    <span style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>

              <div className="workspace-panel rounded-[16px] p-4 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[28px] font-semibold tracking-tight text-[#22252a]">
                    最近草稿
                  </h3>
                  <button
                    onClick={() => router.push("/drafts")}
                    className="text-sm text-[#858c96] transition-colors hover:text-[#22252a]"
                  >
                    查看全部
                  </button>
                </div>

                <div className="mt-4">
                  {dataLoading ? (
                    <p className="py-10 text-sm text-[#858c96]">加载中...</p>
                  ) : recentDrafts.length === 0 ? (
                    <div className="workspace-subpanel rounded-[12px] p-5 text-sm text-[#5d636c]">
                      还没有草稿，点击右上角“新建草稿”开始创作。
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e6e2db]">
                      {recentDrafts.slice(0, 4).map((draft) => (
                        <button
                          key={draft.draftId}
                          onClick={() =>
                            router.push(`/drafts/${draft.draftId}`)
                          }
                          className="flex w-full items-center justify-between gap-4 py-5 text-left"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[28px] font-medium tracking-tight text-[#22252a]">
                              {draft.title || "未命名草稿"}
                            </p>
                            <p className="mt-2 truncate text-sm text-[#5d636c]">
                              {draft.summary || "长文草稿 · 持续编辑中"}
                            </p>
                            <p className="mt-1 text-xs text-[#858c96]">
                              {draft.updateTime || "刚刚更新"}
                            </p>
                          </div>
                          <span
                            className={`workspace-status ${draft.status === 1 ? "success" : ""}`}
                          >
                            {renderDraftStatus(draft)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="workspace-panel rounded-[16px] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[28px] font-semibold tracking-tight text-[#22252a]">
                    工具入口
                  </h3>
                  <span className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">
                    常用
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {toolEntries.map((tool) => (
                    <button
                      key={tool.title}
                      onClick={tool.action}
                      className="workspace-subpanel flex w-full items-center justify-between rounded-[10px] px-4 py-3 text-left transition-colors hover:bg-white"
                    >
                      <span className="text-sm text-[#22252a]">
                        {tool.title}
                      </span>
                      <span className="text-xs text-[#858c96]">
                        {tool.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="workspace-panel rounded-[16px] p-4">
                <h3 className="text-[28px] font-semibold tracking-tight text-[#22252a]">
                  最近动态
                </h3>
                <div className="mt-4 space-y-4">
                  {activityFeed.length === 0 ? (
                    <p className="text-sm text-[#858c96]">
                      最近还没有新的创作活动。
                    </p>
                  ) : (
                    activityFeed.map((item) => (
                      <div key={item.id}>
                        <p className="text-sm leading-6 text-[#5d636c]">
                          {item.text}
                        </p>
                        <p className="mt-1 text-xs text-[#858c96]">
                          {item.time}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="workspace-panel rounded-[16px] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#22252a]">
                    最近发布
                  </h3>
                  <button
                    onClick={() => router.push("/articles")}
                    className="text-sm text-[#858c96] hover:text-[#22252a]"
                  >
                    进入
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {recentArticles.length === 0 ? (
                    <p className="text-sm text-[#858c96]">暂无文章发布记录。</p>
                  ) : (
                    recentArticles.slice(0, 3).map((article) => (
                      <button
                        key={article.articleId}
                        onClick={() =>
                          router.push(`/articles/${article.articleId}`)
                        }
                        className="workspace-subpanel w-full rounded-[10px] p-4 text-left transition-colors hover:bg-white"
                      >
                        <p className="line-clamp-2 text-sm font-medium text-[#22252a]">
                          {article.title}
                        </p>
                        <p className="mt-2 text-xs text-[#858c96]">
                          {article.publishTime || "刚刚发布"} ·{" "}
                          {article.viewCount} 阅读
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
