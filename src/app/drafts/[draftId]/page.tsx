"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getUserInfo } from "@/utils/cookie";
import { draftsApi } from "@/api/drafts";
import { articlesApi } from "@/api/articles";

import AiWritingPanel from "@/components/AiWritingPanel";
import PublishDialog from "@/components/PublishDialog";
import DraftMetaPanel from "@/components/DraftMetaPanel";
import MdxEditor from "@/components/MdxEditor";
import type { MDXEditorMethods } from "@mdxeditor/editor";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type EditorMode = "native" | "visual";

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
  const [editorMode, setEditorMode] = useState<EditorMode>("native");

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const summaryRef = useRef(summary);
  const coverRef = useRef(coverUrl);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<MDXEditorMethods>(null);
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

  useEffect(() => {
    if (editorMode === "visual") {
      setSelectedText("");
    }
  }, [editorMode]);

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
    if (editorMode === "native" && selectedText) {
      params.selectedText = selectedText;
    }
    return params;
  }, [editorMode, selectedText]);

  const handleApplyResult = useCallback(
    (action: "append" | "replace" | "fillSummary", nextContent: string) => {
      if (!nextContent.trim()) return;
      if (action === "append") {
        setContent((prev) =>
          [prev.trimEnd(), nextContent.trim()].filter(Boolean).join("\n\n"),
        );
      } else if (action === "replace") {
        setContent(nextContent.trim());
      } else if (action === "fillSummary") {
        setSummary(nextContent.trim());
      }
    },
    [],
  );

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

  useEffect(() => {
    if (editorMode !== "visual") return;
    const editor = visualEditorRef.current;
    if (!editor) return;
    const currentMarkdown = editor.getMarkdown();
    if (currentMarkdown !== content) {
      editor.setMarkdown(content);
    }
  }, [content, editorMode]);

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-gradient flex items-center justify-center">
        <p className="text-slate-400">加载草稿中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg-gradient p-5">
      <div className="workspace-shell mx-auto flex min-h-[calc(100vh-40px)] max-w-[1440px] flex-col overflow-hidden">
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
              <p className="text-sm text-[#22252a]">编辑模式</p>
              <p className="mt-2 text-xs leading-5 text-[#858c96]">
                原生编辑保留 Markdown 源码输入；可视化编辑会直接在渲染后的内容上编辑，并提供更强的工具栏。
              </p>
            </div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-[#fcfbf8]">
            <div className="border-b border-[#e6e2db] px-5 py-3 md:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative inline-grid grid-cols-2 rounded-full bg-[#f3f0eb] p-1">
                  <span
                    className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[#22252a] transition-transform duration-200 ${
                      editorMode === "visual" ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setEditorMode("native")}
                    className={`relative z-10 px-4 py-2 text-xs font-medium transition-colors ${
                      editorMode === "native" ? "text-white" : "text-[#5d636c]"
                    }`}
                  >
                    原生编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("visual")}
                    className={`relative z-10 px-4 py-2 text-xs font-medium transition-colors ${
                      editorMode === "visual" ? "text-white" : "text-[#5d636c]"
                    }`}
                  >
                    可视化编辑
                  </button>
                </div>
                <p className="text-xs text-[#858c96]">
                  {editorMode === "native"
                    ? "当前为原生 Markdown 输入，不显示工具栏。"
                    : "当前为渲染后直接编辑模式，顶部提供撤销重做和格式工具栏。"}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {editorMode === "native" ? (
                <div className="h-full overflow-y-auto px-5 py-6 md:px-8 md:py-8">
                  <textarea
                    ref={contentTextareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onMouseUp={handleSelect}
                    onKeyUp={handleSelect}
                    placeholder="开始输入正文内容，支持 Markdown 标题、列表、代码块、表格、数学公式等语法。"
                    className="min-h-full w-full resize-none bg-transparent text-[15px] leading-8 text-[#22252a] outline-none placeholder:text-[#b9b2a8]"
                  />
                </div>
              ) : (
                <div className="h-full overflow-hidden px-5 py-5 md:px-8 md:py-6">
                  <div className="h-full overflow-hidden rounded-[16px] border border-[#e6e2db] bg-[#faf8f4]">
                    <MdxEditor
                      ref={visualEditorRef}
                      markdown={content}
                      onChange={setContent}
                    />
                  </div>
                </div>
              )}
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
