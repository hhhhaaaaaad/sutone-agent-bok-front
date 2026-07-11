import { API_CONFIG } from '@/config/api-config';
import { Response, PageResponse } from '@/types/api';
import type {
  SaveDraftRequest,
  SaveDraftResponse,
  DraftDetailResponse,
  DraftPageItem,
} from '@/types/draft';

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

export const draftsApi = {
  /** 保存/更新草稿 */
  save: async (data: SaveDraftRequest): Promise<Response<SaveDraftResponse>> => {
    const res = await fetch(`${BASE}/drafts/save`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<SaveDraftResponse>(res);
  },

  /** 获取草稿详情 */
  detail: async (draftId: number): Promise<Response<DraftDetailResponse>> => {
    const res = await fetch(`${BASE}/drafts/${draftId}`, {
      credentials: "include",
    });
    return handleResponse<DraftDetailResponse>(res);
  },

  /** 草稿分页列表 */
  page: async (pageNo = 1, pageSize = 10): Promise<Response<PageResponse<DraftPageItem>>> => {
    const res = await fetch(`${BASE}/drafts/page?pageNo=${pageNo}&pageSize=${pageSize}`, {
      credentials: "include",
    });
    return handleResponse<PageResponse<DraftPageItem>>(res);
  },

  /** 废弃草稿 */
  discard: async (draftId: number): Promise<Response<{ draftId: number; status: number; statusDesc: string }>> => {
    const res = await fetch(`${BASE}/drafts/${draftId}/discard`, {
      credentials: 'include', method: 'POST' });
    return handleResponse(res);
  },
};
