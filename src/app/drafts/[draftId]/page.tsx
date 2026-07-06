'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUserInfo } from '@/utils/cookie';
import { draftsApi } from '@/api/drafts';
import { articlesApi } from '@/api/articles';
import { aiWritingApi } from '@/api/ai-writing';
import type { AiTaskStatus, AiTaskType } from '@/types/ai-writing';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const AI_ACTIONS: Array<{ label: string; taskType: AiTaskType }> = [
  { label: '生成大纲', taskType: 'GENERATE_OUTLINE' },
  { label: '续写正文', taskType: 'GENERATE_BODY' },
  { label: '润色改写', taskType: 'POLISH_TEXT' },
  { label: '生成摘要', taskType: 'SUMMARIZE' },
];

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
  const [aiTaskStatus, setAiTaskStatus] = useState<AiTaskStatus>('idle');
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [currentTaskType, setCurrentTaskType] = useState<AiTaskType | null>(null);
  const [aiResultBuffer, setAiResultBuffer] = useState('');
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const summaryRef = useRef(summary);
  const coverRef = useRef(coverUrl);
  const savingRef = useRef(false);
  const dirtyRef = useRef(false);
  const streamControllerRef = useRef<AbortController | null>(null);

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

  const handleAiTask = async (taskType: AiTaskType) => {
    if (aiTaskStatus === 'pending' || aiTaskStatus === 'streaming') return;
    setCurrentTaskType(taskType);
    setAiResultBuffer('');
    setAiStatusMessage('任务提交中...');
    setAiTaskStatus('pending');
    try {
      const resp = await aiWritingApi.submitTask({
        draftId,
        taskType,
        promptParams: { title: titleRef.current },
      });
      const taskId = resp.data.taskId;
      setCurrentTaskId(taskId);
      setAiTaskStatus('streaming');
      const controller = await aiWritingApi.streamTask(
        taskId,
        event => {
          if (event.chunk.type === 'status') {
            setAiStatusMessage(event.chunk.content);
          }
          if (event.chunk.type === 'token') {
            setAiResultBuffer(prev => prev + event.chunk.content);
          }
          if (event.chunk.type === 'done') {
            setAiStatusMessage('生成完成');
            setAiTaskStatus('done');
          }
          if (event.chunk.type === 'error') {
            setAiStatusMessage(event.chunk.content || '生成失败');
            setAiTaskStatus('error');
          }
        },
        err => {
          setAiStatusMessage(err.message || '生成失败');
          setAiTaskStatus('error');
        },
        () => {
          setAiTaskStatus(prev => prev === 'error' ? 'error' : 'done');
          streamControllerRef.current = null;
        },
      );
      streamControllerRef.current = controller;
    } catch (e: unknown) {
      setAiStatusMessage(e instanceof Error ? e.message : '提交 AI 任务失败');
      setAiTaskStatus('error');
    }
  };

  const stopAiTask = () => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setAiStatusMessage('已停止生成');
    setAiTaskStatus('idle');
  };

  const appendAiResult = () => {
    if (!aiResultBuffer.trim()) return;
    setContent(prev => [prev.trimEnd(), aiResultBuffer.trim()].filter(Boolean).join('\n\n'));
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

          {/* AI Writing Panel */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-600">AI 写作助手</h4>
              {currentTaskId && <span className="text-[10px] text-slate-400">#{currentTaskId}</span>}
            </div>
            <div className="flex flex-col gap-2">
              {AI_ACTIONS.map(action => (
                <button
                  key={action.taskType}
                  onClick={() => handleAiTask(action.taskType)}
                  disabled={aiTaskStatus === 'pending' || aiTaskStatus === 'streaming'}
                  className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:border-emerald-300"
                >
                  {action.label}
                  {currentTaskType === action.taskType && aiTaskStatus === 'streaming' && (
                    <span className="float-right text-[10px] text-emerald-500">生成中</span>
                  )}
                </button>
              ))}
            </div>

            {aiStatusMessage && (
              <p className={`text-[10px] mt-3 ${aiTaskStatus === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
                {aiStatusMessage}
              </p>
            )}

            {aiResultBuffer && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="max-h-52 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                  {aiResultBuffer}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button onClick={appendAiResult} className="px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs hover:bg-emerald-100">追加正文</button>
                  <button onClick={replaceAiResult} className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs hover:bg-slate-200">替换正文</button>
                  <button onClick={fillSummaryFromAi} className="px-2 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs hover:bg-teal-100">回填摘要</button>
                  <button onClick={() => setAiResultBuffer('')} className="px-2 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs hover:bg-slate-100">清空结果</button>
                </div>
              </div>
            )}

            {(aiTaskStatus === 'pending' || aiTaskStatus === 'streaming') && (
              <button onClick={stopAiTask} className="w-full mt-3 px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-red-500 text-xs hover:bg-red-100">
                停止生成
              </button>
            )}
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
