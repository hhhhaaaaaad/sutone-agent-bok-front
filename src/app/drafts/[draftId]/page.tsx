'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import { articlesApi } from '@/api/articles';
import type { DraftDetailResponse } from '@/types/draft';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function DraftEditorPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = Number(params.draftId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusDesc, setStatusDesc] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const summaryRef = useRef(summary);
  const coverRef = useRef(coverUrl);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { summaryRef.current = summary; }, [summary]);
  useEffect(() => { coverRef.current = coverUrl; }, [coverUrl]);

  // Auth check + load draft
  useEffect(() => {
    const user = getUserInfo();
    if (!user?.user) { router.push('/login'); return; }
    if (!draftId) return;

    (async () => {
      try {
        const resp = await draftsApi.detail(draftId);
        const d = resp.data;
        setTitle(d.title ?? '');
        setContent(d.contentMd ?? '');
        setSummary(d.summary ?? '');
        setCoverUrl(d.coverUrl ?? '');
        setStatusDesc(d.statusDesc ?? '');
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : '加载草稿失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [draftId, router]);

  // Auto-save: debounce 1.5s
  const doSave = useCallback(async () => {
    if (savingRef.current) { dirtyRef.current = true; return; }
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      const resp = await draftsApi.save({
        draftId,
        title: titleRef.current,
        contentMd: contentRef.current,
        summary: summaryRef.current,
        coverUrl: coverRef.current,
      });
      setStatusDesc(resp.data.statusDesc ?? '');
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
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

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const tags = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
      const resp = await articlesApi.publish({ draftId, tags });
      router.push(`/articles/${resp.data.articleId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发布失败');
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
    <div className="min-h-screen flex flex-col theme-bg-gradient">
      {/* ===== Top Toolbar ===== */}
      <header className="h-14 px-4 flex items-center gap-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm shrink-0">
        <button onClick={() => router.push('/drafts')} className="text-slate-400 hover:text-slate-700 text-sm shrink-0">
          &larr; 草稿箱
        </button>

        <div className="flex-1">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full text-lg font-semibold text-slate-800 bg-transparent outline-none placeholder:text-slate-300"
          />
        </div>

        <span className={`text-xs shrink-0 ${
          saveStatus === 'saving' ? 'text-amber-500' :
          saveStatus === 'saved' ? 'text-emerald-500' :
          saveStatus === 'error' ? 'text-red-500' : 'text-slate-400'
        }`}>
          {saveStatus === 'saving' ? '保存中...' :
           saveStatus === 'saved' ? '已保存' :
           saveStatus === 'error' ? '保存失败' : ''}
        </span>

        <button
          onClick={() => setShowPublishDialog(true)}
          disabled={!title.trim() || !content.trim()}
          className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:shadow-lg transition-all shrink-0"
        >
          发布
        </button>
      </header>

      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">关闭</button>
        </div>
      )}

      {/* ===== Main: Two Column ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="开始用 Markdown 写作...&#10;&#10;提示：支持标题、列表、代码块等 Markdown 语法"
              className="w-full h-full resize-none bg-transparent text-slate-700 leading-relaxed outline-none placeholder:text-slate-300 font-mono text-sm"
            />
          </div>
        </div>

        {/* Right: Side Panel */}
        <aside className="w-72 border-l border-slate-200/60 bg-white/40 backdrop-blur-sm p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
          {/* Meta */}
          <div>
            <label className="text-xs text-slate-500 font-medium">摘要</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={3}
              placeholder="简要描述文章内容..."
              className="w-full mt-1 p-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-emerald-300 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium">封面图 URL</label>
            <input
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full mt-1 p-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-emerald-300"
            />
          </div>

          {/* AI Writing Panel (placeholder for M3) */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-4 mt-2">
            <h4 className="text-sm font-semibold text-slate-600 mb-3">🤖 AI 写作助手</h4>
            <div className="flex flex-col gap-2">
              {['生成大纲', '续写正文', '润色改写', '生成摘要'].map(action => (
                <button
                  key={action}
                  disabled
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-400 disabled:cursor-not-allowed"
                >
                  {action}
                  <span className="float-right text-[10px] text-slate-300">即将上线</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">
              AI 写作链路将在 M3 阶段接入，届时可在此处直接调用 AI 生成/润色能力。
            </p>
          </div>
        </aside>
      </div>

      {/* ===== Publish Dialog ===== */}
      {showPublishDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPublishDialog(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">发布文章</h3>
            <label className="text-sm text-slate-600">标签（逗号分隔）</label>
            <input
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="例如: Java, Spring, 微服务"
              className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-300"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowPublishDialog(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">取消</button>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {publishing ? '发布中...' : '确认发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
