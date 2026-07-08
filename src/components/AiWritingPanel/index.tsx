"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { aiWritingApi } from "@/api/ai-writing";
import type { AiTaskStatus, AiTaskType, AiTaskDetailResponse } from "@/types/ai-writing";

interface AiWritingPanelProps {
  draftId: number;
  content: string;
  getPromptParams: () => Record<string, unknown>;
  onApplyResult: (action: "append" | "replace" | "fillSummary", resultContent: string) => void;
}

const WRITING_ACTIONS: Array<{ label: string; taskType: AiTaskType }> = [
  { label: "生成大纲", taskType: "GENERATE_OUTLINE" },
  { label: "续写正文", taskType: "GENERATE_BODY" },
  { label: "润色改写", taskType: "POLISH_TEXT" },
];

const AUX_ACTIONS: Array<{ label: string; taskType: AiTaskType }> = [
  { label: "生成标题", taskType: "GENERATE_TITLE" },
  { label: "生成标签", taskType: "GENERATE_TAGS" },
  { label: "发布质量检查", taskType: "QUALITY_CHECK" },
  { label: "生成摘要", taskType: "SUMMARIZE" },
];

const TASK_TYPE_LABELS: Record<string, string> = {
  GENERATE_OUTLINE: "生成大纲",
  GENERATE_BODY: "续写正文",
  POLISH_TEXT: "润色改写",
  SUMMARIZE: "生成摘要",
  GENERATE_TITLE: "生成标题",
  GENERATE_TAGS: "生成标签",
  QUALITY_CHECK: "发布质量检查",
};

interface TaskCard {
  taskId: number;
  taskType: string;
  content: string;
  createTime: string;
  status: number;
}

export default function AiWritingPanel({ draftId, content, getPromptParams, onApplyResult }: AiWritingPanelProps) {
  const [customInstruction, setCustomInstruction] = useState("");
  const [showAux, setShowAux] = useState(false);
  const [aiTaskStatus, setAiTaskStatus] = useState<AiTaskStatus>("idle");
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [currentTaskType, setCurrentTaskType] = useState<AiTaskType | null>(null);
  const [aiResultBuffer, setAiResultBuffer] = useState("");
  const [aiStatusMessage, setAiStatusMessage] = useState("");
  const [taskHistory, setTaskHistory] = useState<TaskCard[]>([]);
  const streamControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await aiWritingApi.queryTaskList(draftId, 5);
        const list = (resp.data || []).map((item: AiTaskDetailResponse) => ({
          taskId: item.taskId,
          taskType: item.taskType,
          content: item.responseContent || "",
          createTime: item.createTime,
          status: item.status,
        }));
        setTaskHistory(list);
      } catch {
        // ignore
      }
    })();
  }, [draftId]);

  const handleAiTask = useCallback(async (taskType: AiTaskType) => {
    if (aiTaskStatus === "pending" || aiTaskStatus === "streaming") return;
    setCurrentTaskType(taskType);
    setAiResultBuffer("");
    setAiStatusMessage("任务提交中...");
    setAiTaskStatus("pending");

    const baseParams = getPromptParams();
    const promptParams: Record<string, unknown> = { ...baseParams };
    if (customInstruction.trim()) {
      promptParams.customInstruction = customInstruction.trim();
    }

    try {
      const resp = await aiWritingApi.submitTask({ draftId, taskType, promptParams });
      const taskId = resp.data.taskId;
      setCurrentTaskId(taskId);
      setAiTaskStatus("streaming");
      const controller = await aiWritingApi.streamTask(
        taskId,
        (event) => {
          if (event.chunk.type === "status") setAiStatusMessage(event.chunk.content);
          if (event.chunk.type === "token") setAiResultBuffer((prev) => prev + event.chunk.content);
          if (event.chunk.type === "done") { setAiStatusMessage("生成完成"); setAiTaskStatus("done"); }
          if (event.chunk.type === "error") { setAiStatusMessage(event.chunk.content || "生成失败"); setAiTaskStatus("error"); }
        },
        (err) => { setAiStatusMessage(err.message || "生成失败"); setAiTaskStatus("error"); },
        () => { setAiTaskStatus((prev) => (prev === "error" ? "error" : "done")); streamControllerRef.current = null; },
      );
      streamControllerRef.current = controller;
    } catch (e: unknown) {
      setAiStatusMessage(e instanceof Error ? e.message : "提交 AI 任务失败");
      setAiTaskStatus("error");
    }
  }, [draftId, customInstruction, aiTaskStatus, getPromptParams]);

  const stopAiTask = useCallback(() => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setAiStatusMessage("已停止生成");
    setAiTaskStatus("idle");
  }, []);

  const isRunning = aiTaskStatus === "pending" || aiTaskStatus === "streaming";

  const renderActionButtons = (actions: Array<{ label: string; taskType: AiTaskType }>) =>
    actions.map((action) => (
      <button key={action.taskType} onClick={() => handleAiTask(action.taskType)} disabled={isRunning}
        className="flex w-full items-center justify-between rounded-[10px] border border-[#e6e2db] bg-white px-3 py-2 text-sm text-[#5d636c] transition hover:border-[#b4bdc7] disabled:cursor-not-allowed disabled:text-[#b9b2a8]">
        <span>{action.label}</span>
        {currentTaskType === action.taskType && aiTaskStatus === "streaming" ? (
          <span className="text-[10px] text-[#7fa08a]">生成中</span>
        ) : (
          <span className="text-[10px] text-[#858c96]">执行</span>
        )}
      </button>
    ));

  return (
    <div className="workspace-subpanel rounded-[12px] p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#22252a]">AI 写作助手</p>
        {currentTaskId && <span className="text-[10px] text-[#858c96]">#{currentTaskId}</span>}
      </div>

      <div className="mt-3">
        <textarea value={customInstruction} onChange={(e) => setCustomInstruction(e.target.value)}
          placeholder="输入自定义写作指令（可选）" rows={2}
          className="w-full rounded-[10px] border border-[#e6e2db] bg-white p-2 text-xs text-[#5d636c] outline-none placeholder:text-[#b9b2a8] resize-none" />
      </div>

      <div className="mt-2 space-y-2">{renderActionButtons(WRITING_ACTIONS)}</div>

      <button onClick={() => setShowAux(!showAux)}
        className="mt-2 w-full rounded-[10px] border border-dashed border-[#e6e2db] px-3 py-1.5 text-xs text-[#858c96] transition hover:border-[#b4bdc7]">
        {showAux ? "收起辅助功能" : "更多写作功能"}
      </button>
      {showAux && <div className="mt-2 space-y-2">{renderActionButtons(AUX_ACTIONS)}</div>}

      {aiStatusMessage && (
        <p className={`mt-3 text-[11px] ${aiTaskStatus === "error" ? "text-red-500" : "text-[#858c96]"}`}>{aiStatusMessage}</p>
      )}

      {aiResultBuffer && (
        <div className="mt-3 rounded-[12px] border border-[#e6e2db] bg-white p-3">
          <p className="text-[10px] text-[#858c96] mb-1">{currentTaskType ? TASK_TYPE_LABELS[currentTaskType] || currentTaskType : "AI 结果"}</p>
          <div className="max-h-52 overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-[#5d636c]">{aiResultBuffer}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => onApplyResult("append", aiResultBuffer)} className="rounded-[10px] bg-[#eef5f0] px-2 py-2 text-xs text-[#567260] transition hover:bg-[#e4efe8]">追加正文</button>
            <button onClick={() => onApplyResult("replace", aiResultBuffer)} className="rounded-[10px] bg-[#f0ede8] px-2 py-2 text-xs text-[#5d636c] transition hover:bg-[#e7e1d8]">替换正文</button>
            <button onClick={() => onApplyResult("fillSummary", aiResultBuffer)} className="rounded-[10px] bg-[#edf3f6] px-2 py-2 text-xs text-[#56738a] transition hover:bg-[#e2ebf0]">回填摘要</button>
            <button onClick={() => setAiResultBuffer("")} className="rounded-[10px] bg-[#f7f5f2] px-2 py-2 text-xs text-[#858c96] transition hover:bg-[#ece7df]">清空结果</button>
          </div>
        </div>
      )}

      {isRunning && (
        <button onClick={stopAiTask} className="mt-3 w-full rounded-[10px] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500 transition hover:bg-red-100">停止生成</button>
      )}

      {taskHistory.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-[#858c96] mb-2">历史记录</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {taskHistory.map((task) => (
              <div key={task.taskId} className="rounded-[10px] border border-[#e6e2db] bg-white p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#5d636c]">{TASK_TYPE_LABELS[task.taskType] || task.taskType}</span>
                  <span className="text-[10px] text-[#858c96]">{task.createTime?.slice(0, 16) || ""}</span>
                </div>
                {task.content && <p className="mt-1 text-[11px] text-[#858c96] line-clamp-2">{task.content}</p>}
                {task.status === 1 && task.content && (
                  <div className="mt-1 flex gap-2">
                    <button onClick={() => onApplyResult("append", task.content)} className="text-[10px] text-[#567260] hover:underline">追加</button>
                    <button onClick={() => onApplyResult("replace", task.content)} className="text-[10px] text-[#5d636c] hover:underline">替换</button>
                    <button onClick={() => onApplyResult("fillSummary", task.content)} className="text-[10px] text-[#56738a] hover:underline">填摘要</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
