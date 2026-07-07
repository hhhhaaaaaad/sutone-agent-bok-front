"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserInfo } from "@/utils/cookie";
import { draftsApi } from "@/api/drafts";
import { articlesApi } from "@/api/articles";
import { aiWritingApi } from "@/api/ai-writing";
import type { AiTaskStatus, AiTaskType } from "@/types/ai-writing";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AI_ACTIONS: Array<{ label: string; taskType: AiTaskType }> = [
  { label: "生成大纲", taskType: "GENERATE_OUTLINE" },
  { label: "续写正文", taskType: "GENERATE_BODY" },
  { label: "润色改写", taskType: "POLISH_TEXT" },
  { label: "生成摘要", taskType: "SUMMARIZE" },
];

export default function DraftEditorPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = Number(params.draftId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [aiTaskStatus, setAiTaskStatus] = useState<AiTaskStatus>("idle");
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [currentTaskType, setCurrentTaskType] = useState<AiTaskType | null>(
    null,
  );
  const [aiResultBuffer, setAiResultBuffer] = useState("");
  const [aiStatusMessage, setAiStatusMessage] = useState("");

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const summaryRef = useRef(summary);
  const coverRef = useRef(coverUrl);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const streamControllerRef = useRef<AbortController | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);
  useEffect(() => {
    coverRef.current = coverUrl;
  }, [coverUrl]);

  // Auth check + load draft
  useEffect(() => {
    const user = getUserInfo();
    if (!user?.user) {
      router.push("/login");
      return;
    }
    if (!draftId) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const resp = await draftsApi.detail(draftId);
        const d = resp.data;
        setTitle(d.title ?? "");
        setContent(d.contentMd ?? "");
        setSummary(d.summary ?? "");
        setCoverUrl(d.coverUrl ?? "");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "加载草稿失败");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Auto-save: debounce 1.5s
  const doSave = useCallback(async () => {
    if (savingRef.current) {
      dirtyRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      const resp = await draftsApi.save({
        draftId,
        title: titleRef.current,
        contentMd: contentRef.current,
        summary: summaryRef.current,
        coverUrl: coverRef.current,
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setTimeout(doSave, 300);
      }
    }
  }, [draftId]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(doSave, 1500);
    return () => clearTimeout(timer);
  }, [title, content, summary, coverUrl, loading, doSave]);

  const handleAiTask = async (taskType: AiTaskType) => {
    if (aiTaskStatus === "pending" || aiTaskStatus === "streaming") return;
    setCurrentTaskType(taskType);
    setAiResultBuffer("");
    setAiStatusMessage("任务提交中...");
    setAiTaskStatus("pending");
    try {
      const resp = await aiWritingApi.submitTask({
        draftId,
        taskType,
        promptParams: { title: titleRef.current },
      });
      const taskId = resp.data.taskId;
      setCurrentTaskId(taskId);
      setAiTaskStatus("streaming");
      const controller = await aiWritingApi.streamTask(
        taskId,
        (event) => {
          if (event.chunk.type === "status") {
            setAiStatusMessage(event.chunk.content);
          }
          if (event.chunk.type === "token") {
            setAiResultBuffer((prev) => prev + event.chunk.content);
          }
          if (event.chunk.type === "done") {
            setAiStatusMessage("生成完成");
            setAiTaskStatus("done");
          }
          if (event.chunk.type === "error") {
            setAiStatusMessage(event.chunk.content || "生成失败");
            setAiTaskStatus("error");
          }
        },
        (err) => {
          setAiStatusMessage(err.message || "生成失败");
          setAiTaskStatus("error");
        },
        () => {
          setAiTaskStatus((prev) => (prev === "error" ? "error" : "done"));
          streamControllerRef.current = null;
        },
      );
      streamControllerRef.current = controller;
    } catch (e: unknown) {
      setAiStatusMessage(e instanceof Error ? e.message : "提交 AI 任务失败");
      setAiTaskStatus("error");
    }
  };

  const stopAiTask = () => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setAiStatusMessage("已停止生成");
    setAiTaskStatus("idle");
  };

  const appendAiResult = () => {
    if (!aiResultBuffer.trim()) return;
    setContent((prev) =>
      [prev.trimEnd(), aiResultBuffer.trim()].filter(Boolean).join("\n\n"),
    );
  };

  const replaceAiResult = () => {
    if (!aiResultBuffer.trim()) return;
    setContent(aiResultBuffer.trim());
  };

  const fillSummaryFromAi = () => {
    if (!aiResultBuffer.trim()) return;
    setSummary(aiResultBuffer.trim());
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const resp = await articlesApi.publish({ draftId, tags });
      router.push(`/articles/${resp.data.articleId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发布失败");
      setPublishing(false);
      setShowPublishDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-gradient flex items-center justify-center">
        <p className="text-slate-400">加载草稿中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[1180px] flex-col overflow-hidden">
        <header className="flex h-[72px] items-center justify-between gap-4 border-b border-[#e6e2db] bg-[#fcfbf8] px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => router.push("/drafts")}
              className="workspace-secondary-btn px-3 py-2 text-sm font-medium"
            >
              返回草稿列表
            </button>
            <div className="min-w-0">
              <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">
                工作区 / 草稿编辑
              </p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入文章标题"
                className="mt-1 w-full min-w-[260px] max-w-[520px] bg-transparent text-[26px] font-semibold tracking-tight text-[#22252a] outline-none placeholder:text-[#b9b2a8]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs ${
                saveStatus === "saving"
                  ? "text-amber-600"
                  : saveStatus === "saved"
                    ? "text-[#7fa08a]"
                    : saveStatus === "error"
                      ? "text-red-500"
                      : "text-[#858c96]"
              }`}
            >
              {saveStatus === "saving"
                ? "保存中…"
                : saveStatus === "saved"
                  ? "已保存"
                  : saveStatus === "error"
                    ? "保存失败"
                    : "自动保存"}
            </span>
            <button
              onClick={() => setShowPublishDialog(true)}
              disabled={!title.trim() || !content.trim()}
              className="workspace-primary-btn px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              发布文章
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-4 mt-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
            <button onClick={() => setError("")} className="ml-2 underline">
              关闭
            </button>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <aside className="hidden w-[240px] shrink-0 border-r border-[#e6e2db] bg-[#f1ece6] p-5 lg:flex lg:flex-col lg:gap-4">
            <div>
              <p className="workspace-mono text-[11px] tracking-[0.14em] text-[#858c96]">
                当前状态
              </p>
              <h3 className="mt-2 text-[22px] font-semibold text-[#22252a]">
                专注写作
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#5d636c]">
                左侧保留当前写作上下文，右侧集中处理摘要、封面与发布动作。
              </p>
            </div>
            <div className="workspace-panel rounded-[12px] p-4">
              <p className="text-sm text-[#22252a]">自动保存</p>
              <p className="mt-2 text-xs text-[#858c96]">
                每次停顿约 1.5 秒后自动提交草稿内容。
              </p>
            </div>
            <div className="workspace-panel rounded-[12px] p-4">
              <p className="text-sm text-[#22252a]">写作建议</p>
              <ul className="mt-2 space-y-2 text-xs leading-5 text-[#5d636c]">
                <li>先补标题与摘要，再展开正文结构。</li>
                <li>发布前检查标签和封面图链接。</li>
                <li>长段落建议拆分成短节，便于后续润色。</li>
              </ul>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-[#fcfbf8]">
            <div className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始输入正文内容，支持 Markdown 标题、列表、代码块等语法。"
                className="min-h-full w-full resize-none bg-transparent text-[15px] leading-8 text-[#22252a] outline-none placeholder:text-[#b9b2a8]"
              />
            </div>
          </section>

          <aside className="w-[320px] shrink-0 border-l border-[#e6e2db] bg-[#fcfbf8] p-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#5d636c]">
                  摘要说明
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="用 2 到 3 句话概括这篇文章的重点。"
                  className="mt-2 w-full rounded-[12px] border border-[#e6e2db] bg-[#fcfbf8] p-3 text-sm text-[#22252a] outline-none focus:border-[#b4bdc7]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#5d636c]">
                  封面图链接
                </label>
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://example.com/cover.png"
                  className="workspace-input mt-2 w-full text-sm"
                />
              </div>

              <div className="workspace-subpanel rounded-[12px] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#22252a]">
                    AI 写作助手
                  </p>
                  {currentTaskId && (
                    <span className="text-[10px] text-[#858c96]">
                      #{currentTaskId}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {AI_ACTIONS.map((action) => (
                    <button
                      key={action.taskType}
                      onClick={() => handleAiTask(action.taskType)}
                      disabled={
                        aiTaskStatus === "pending" ||
                        aiTaskStatus === "streaming"
                      }
                      className="flex w-full items-center justify-between rounded-[10px] border border-[#e6e2db] bg-white px-3 py-2 text-sm text-[#5d636c] transition hover:border-[#b4bdc7] disabled:cursor-not-allowed disabled:text-[#b9b2a8]"
                    >
                      <span>{action.label}</span>
                      {currentTaskType === action.taskType &&
                      aiTaskStatus === "streaming" ? (
                        <span className="text-[10px] text-[#7fa08a]">
                          生成中
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#858c96]">执行</span>
                      )}
                    </button>
                  ))}
                </div>

                {aiStatusMessage && (
                  <p
                    className={`mt-3 text-[11px] ${
                      aiTaskStatus === "error"
                        ? "text-red-500"
                        : "text-[#858c96]"
                    }`}
                  >
                    {aiStatusMessage}
                  </p>
                )}

                {aiResultBuffer && (
                  <div className="mt-3 rounded-[12px] border border-[#e6e2db] bg-white p-3">
                    <div className="max-h-52 overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-[#5d636c]">
                      {aiResultBuffer}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={appendAiResult}
                        className="rounded-[10px] bg-[#eef5f0] px-2 py-2 text-xs text-[#567260] transition hover:bg-[#e4efe8]"
                      >
                        追加正文
                      </button>
                      <button
                        onClick={replaceAiResult}
                        className="rounded-[10px] bg-[#f0ede8] px-2 py-2 text-xs text-[#5d636c] transition hover:bg-[#e7e1d8]"
                      >
                        替换正文
                      </button>
                      <button
                        onClick={fillSummaryFromAi}
                        className="rounded-[10px] bg-[#edf3f6] px-2 py-2 text-xs text-[#56738a] transition hover:bg-[#e2ebf0]"
                      >
                        回填摘要
                      </button>
                      <button
                        onClick={() => setAiResultBuffer("")}
                        className="rounded-[10px] bg-[#f7f5f2] px-2 py-2 text-xs text-[#858c96] transition hover:bg-[#ece7df]"
                      >
                        清空结果
                      </button>
                    </div>
                  </div>
                )}

                {(aiTaskStatus === "pending" ||
                  aiTaskStatus === "streaming") && (
                  <button
                    onClick={stopAiTask}
                    className="mt-3 w-full rounded-[10px] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500 transition hover:bg-red-100"
                  >
                    停止生成
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ===== Publish Dialog ===== */}
      {showPublishDialog && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowPublishDialog(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4">发布文章</h3>
            <label className="text-sm text-slate-600">标签（逗号分隔）</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="例如: Java, Spring, 微服务"
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-300"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowPublishDialog(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                取消
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {publishing ? "发布中..." : "确认发布"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
