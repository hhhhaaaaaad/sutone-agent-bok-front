/** AI 写作模块 DTO */

export type AiTaskType = 'GENERATE_OUTLINE' | 'GENERATE_BODY' | 'POLISH_TEXT' | 'SUMMARIZE' | 'GENERATE_TITLE' | 'GENERATE_TAGS' | 'QUALITY_CHECK';

export interface SubmitAiTaskRequest {
  draftId: number;
  taskType: AiTaskType;
  promptParams?: Record<string, unknown>;
}

export interface SubmitAiTaskResponse {
  taskId: number;
  draftId: number;
  taskType: string;
  status: number;
  statusDesc: string;
}

export interface AiTaskDetailResponse {
  taskId: number;
  draftId: number;
  taskType: string;
  status: number;
  statusDesc: string;
  responseContent?: string;
  errorMsg?: string;
  createTime: string;
  updateTime: string;
}

export interface StreamChunk {
  type: 'status' | 'token' | 'result' | 'done' | 'error';
  content: string;
}

export interface StreamEvent {
  phase: 'analyzing' | 'generating' | 'reviewing' | 'thinking' | 'done' | 'error';
  chunk: StreamChunk;
}

export type AiTaskStatus = 'idle' | 'pending' | 'streaming' | 'done' | 'error';
