import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type {
  SubmitAiTaskRequest,
  SubmitAiTaskResponse,
  AiTaskDetailResponse,
  StreamEvent,
} from '@/types/ai-writing';

const BASE = API_CONFIG.BASE_URL;

async function handleResponse<T>(res: globalThis.Response): Promise<Response<T>> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.code !== '0000') {
    throw new Error(json.info || 'API error');
  }
  return json;
}

export const aiWritingApi = {
  /** 提交 AI 写作任务 */
  submitTask: async (data: SubmitAiTaskRequest): Promise<Response<SubmitAiTaskResponse>> => {
    const res = await fetch(`${BASE}/ai-writing/task/submit`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SubmitAiTaskResponse>(res);
  },

  /** 查询任务详情 */
  queryTaskDetail: async (taskId: number): Promise<Response<AiTaskDetailResponse>> => {
    const res = await fetch(`${BASE}/ai-writing/task/${taskId}`, {
      credentials: "include",
    });
    return handleResponse<AiTaskDetailResponse>(res);
  },

  /** SSE 流式获取 AI 生成结果 */
  streamTask: async (
    taskId: number,
    onEvent: (event: StreamEvent) => void,
    onError: (err: Error) => void,
    onComplete: () => void,
  ): Promise<AbortController> => {
    const controller = new AbortController();

    try {
      const res = await fetch(`${BASE}/ai-writing/task/stream?taskId=${taskId}`, {
      credentials: 'include',
        headers: { Accept: 'text/event-stream' },
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        onError(new Error(`HTTP ${res.status}: ${text}`));
        return controller;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const process = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr) continue;
              try {
                const event: StreamEvent = JSON.parse(jsonStr);
                onEvent(event);
              } catch { /* skip unparsable */ }
            }
          }
          if (!controller.signal.aborted) onComplete();
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            onComplete();
            return;
          }
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      };

      process();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        onError(err);
      }
    }

    return controller;
  },

  /** 查询草稿关联的最近 AI 任务列表 */
  queryTaskList: async (draftId: number, limit?: number): Promise<Response<AiTaskDetailResponse[]>> => {
    const params = new URLSearchParams({ draftId: String(draftId) });
    if (limit !== undefined) params.set('limit', String(limit));
    const res = await fetch(`${BASE}/ai-writing/task/list?${params}`, {
      credentials: "include",
    });
    return handleResponse<AiTaskDetailResponse[]>(res);
  },
};
