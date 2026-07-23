import { API_CONFIG } from '@/config/api-config';
import type { ChatMessage } from '@/types/writing-chat';
const BASE = API_CONFIG.BASE_URL;

export const writingChatApi = {
  createSession: async (): Promise<string> => {
    const res = await fetch(`${BASE}/writing/chat/create_session`, {
      method: 'POST', credentials: 'include',
    });
    const json = await res.json();
    if (json.code !== '0000') throw new Error(json.info || '创建会话失败');
    return json.data;
  },

  getHistory: async (sessionId: string, limit = 50): Promise<ChatMessage[]> => {
    const res = await fetch(`${BASE}/writing/chat/history?sessionId=${encodeURIComponent(sessionId)}&limit=${limit}`, {
      method: 'GET', credentials: 'include',
    });
    const json = await res.json();
    if (json.code !== '0000') throw new Error(json.info || '加载历史失败');
    return json.data ?? [];
  },

  streamChat: async (
    sessionId: string, message: string,
    onToken: (text: string) => void, onDone: () => void, onError: (err: Error) => void,
  ): Promise<AbortController> => {
    const controller = new AbortController();
    const res = await fetch(`${BASE}/writing/chat/stream`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
      signal: controller.signal,
    });
    if (!res.ok) { onError(new Error(`HTTP ${res.status}`)); return controller; }

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
            if (!trimmed) continue;
            try {
              const msg = JSON.parse(trimmed);
              if (msg.chunk?.type === 'token') onToken(msg.chunk.content ?? '');
              else if (msg.chunk?.type === 'done') { if (!controller.signal.aborted) onDone(); return; }
              else if (msg.chunk?.type === 'error') { onError(new Error(msg.chunk.content || '')); return; }
            } catch { /* skip non-JSON line */ }
          }
        }
        if (buffer.trim()) {
          try { const msg = JSON.parse(buffer.trim()); if (msg.chunk?.type === 'token') onToken(msg.chunk.content ?? ''); } catch {}
        }
        if (!controller.signal.aborted) onDone();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') { onDone(); return; }
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    process();
    return controller;
  },

  save: async (sessionId: string, messages: Pick<ChatMessage, "role" | "content">[]): Promise<void> => {
    await fetch(`${BASE}/writing/chat/save`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, messages }),
    });
  },
};
