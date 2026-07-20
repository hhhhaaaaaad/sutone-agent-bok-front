import { API_CONFIG } from '@/config/api-config';
import type { MemorySearchResponse, MemoryListResponse, MemoryItem } from '@/types/memory';

const BASE = API_CONFIG.BASE_URL;

async function handleResponse<T>(res: globalThis.Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('登录已过期');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== '0000') throw new Error(json.info || 'API error');
  return json.data;
}

export const memoryApi = {
  search: async (q: string, n = 10): Promise<MemorySearchResponse> => {
    const params = new URLSearchParams({ q, n: String(n) });
    const res = await fetch(`${BASE}/memory/search?${params}`, { credentials: 'include' });
    return handleResponse<MemorySearchResponse>(res);
  },

  list: async (page = 1, pageSize = 10): Promise<MemoryListResponse> => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`${BASE}/memory/list?${params}`, { credentials: 'include' });
    return handleResponse<MemoryListResponse>(res);
  },

  detail: async (id: number): Promise<MemoryItem> => {
    const res = await fetch(`${BASE}/memory/${id}`, { credentials: 'include' });
    return handleResponse<MemoryItem>(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetch(`${BASE}/memory/${id}`, { method: 'DELETE', credentials: 'include' });
    await handleResponse<string>(res);
  },
};
