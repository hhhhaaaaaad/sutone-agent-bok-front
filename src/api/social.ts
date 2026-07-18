import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { LikeStatusResponse, FavoriteStatusResponse, ArticlePageItem } from '@/types/article';

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

export const socialApi = {
  like: async (articleId: number): Promise<Response<LikeStatusResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/like`, {
      credentials: 'include',
      method: 'POST',
    });
    return handleResponse<LikeStatusResponse>(res);
  },

  unlike: async (articleId: number): Promise<Response<LikeStatusResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/like`, {
      credentials: 'include',
      method: 'DELETE',
    });
    return handleResponse<LikeStatusResponse>(res);
  },

  getLikeStatus: async (articleId: number): Promise<Response<LikeStatusResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/like`, {
      credentials: 'include',
    });
    return handleResponse<LikeStatusResponse>(res);
  },

  favorite: async (articleId: number): Promise<Response<FavoriteStatusResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/favorite`, {
      credentials: 'include',
      method: 'POST',
    });
    return handleResponse<FavoriteStatusResponse>(res);
  },

  unfavorite: async (articleId: number): Promise<Response<FavoriteStatusResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/favorite`, {
      credentials: 'include',
      method: 'DELETE',
    });
    return handleResponse<FavoriteStatusResponse>(res);
  },

  getFavoriteStatus: async (articleId: number): Promise<Response<FavoriteStatusResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/favorite`, {
      credentials: 'include',
    });
    return handleResponse<FavoriteStatusResponse>(res);
  },

  getUserLikes: async (): Promise<Response<ArticlePageItem[]>> => {
    const res = await fetch(`${BASE}/user/likes`, { credentials: 'include' });
    return handleResponse<ArticlePageItem[]>(res);
  },

  getUserFavorites: async (): Promise<Response<ArticlePageItem[]>> => {
    const res = await fetch(`${BASE}/user/favorites`, { credentials: 'include' });
    return handleResponse<ArticlePageItem[]>(res);
  },
};
