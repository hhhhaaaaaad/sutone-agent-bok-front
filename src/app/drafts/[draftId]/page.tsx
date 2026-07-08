"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserInfo } from "@/utils/cookie";
import { draftsApi } from "@/api/drafts";
import { articlesApi } from "@/api/articles";

import AiWritingPanel from "@/components/AiWritingPanel";
import PublishDialog from "@/components/PublishDialog";
import DraftMetaPanel from "@/components/DraftMetaPanel";

type SaveStatus = "idle" | "saving" | "saved" | "error";

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
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const summaryRef = useRef(summary);
  const coverRef = useRef(coverUrl);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
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
  }, [draftId, router]);

  const doSave = useCallback(async () => {
    if (savingRef.current) {
      dirtyRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      await draftsApi.save({
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

  const handleSelect = useCallback(() => {
    const ta = contentTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start !== end) {
      setSelectedText(ta.value.substring(start, end));
    } else {
      setSelectedText("");
    }
  }, []);

  const getPromptParams = useCallback(() => {
    const params: Record<string, unknown> = { title: titleRef.current };
    if (selectedText) {
      params.selectedText = selectedText;
    }
    return params;
  }, [selectedText]);

  const handleApplyResult = useCallback((action: "append" | "replace" | "fillSummary", content: string) => {
    if (!content.trim()) return;
    if (action === "append") {
      setContent((prev) => [prev.trimEnd(), content.trim()].filter(Boolean).join("\n\n"));
    } else if (action === "replace") {
      setContent(content.trim());
    } else if (action === "fillSummary") {
      setSummary(content.trim());
    }
  }, []);

  const handlePublish = async (tags: string[]) => {
    setPublishing(true);
    try {
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
                ref={contentTextareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onMouseUp={handleSelect}
                onKeyUp={handleSelect}
                placeholder="开始输入正文内容，支持 Markdown 标题、列表、代码块等语法。"
                className="min-h-full w-full resize-none bg-transparent text-[15px] leading-8 text-[#22252a] outline-none placeholder:text-[#b9b2a8]"
              />
            </div>
          </section>

          <aside className="w-[320px] shrink-0 border-l border-[#e6e2db] bg-[#fcfbf8] p-5">
            <DraftMetaPanel
              summary={summary}
              coverUrl={coverUrl}
              onSummaryChange={setSummary}
              onCoverUrlChange={setCoverUrl}
            />
            <div className="mt-4">
              <AiWritingPanel
                draftId={draftId}
                content={content}
                getPromptParams={getPromptParams}
                onApplyResult={handleApplyResult}
              />
            </div>
          </aside>
        </div>
      </div>

      {showPublishDialog && (
        <PublishDialog
          disabled={!title.trim() || !content.trim()}
          onClose={() => {
            if (!publishing) setShowPublishDialog(false);
          }}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
