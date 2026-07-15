import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { CommentPublishRequest, CommentItemResponse, CommentPageResponse, CommentLikeResponse } from '@/types/comment';

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

export const commentApi = {
  publish: async (articleId: number, data: CommentPublishRequest): Promise<Response<CommentItemResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/comments`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<CommentItemResponse>(res);
  },

  delete: async (articleId: number, commentId: number): Promise<Response<void>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/comments/${commentId}`, {
      credentials: 'include',
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  list: async (articleId: number, page = 1, pageSize = 10): Promise<Response<CommentPageResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/comments?page=${page}&pageSize=${pageSize}`, {
      credentials: 'include',
    });
    return handleResponse<CommentPageResponse>(res);
  },

  like: async (commentId: number): Promise<Response<CommentLikeResponse>> => {
    const res = await fetch(`${BASE}/comments/${commentId}/like`, {
      credentials: 'include',
      method: 'POST',
    });
    return handleResponse<CommentLikeResponse>(res);
  },

  unlike: async (commentId: number): Promise<Response<CommentLikeResponse>> => {
    const res = await fetch(`${BASE}/comments/${commentId}/like`, {
      credentials: 'include',
      method: 'DELETE',
    });
    return handleResponse<CommentLikeResponse>(res);
  },
};
