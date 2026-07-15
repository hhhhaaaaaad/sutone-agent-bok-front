import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { FollowStatusResponse, FollowListResponse } from '@/types/follow';

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

export const followApi = {
  follow: async (userId: number): Promise<Response<void>> => {
    const res = await fetch(`${BASE}/user/follow/${userId}`, {
      credentials: 'include',
      method: 'POST',
    });
    return handleResponse(res);
  },

  unfollow: async (userId: number): Promise<Response<void>> => {
    const res = await fetch(`${BASE}/user/follow/${userId}`, {
      credentials: 'include',
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  getStatus: async (userId: number): Promise<Response<FollowStatusResponse>> => {
    const res = await fetch(`${BASE}/user/${userId}/follow/status`, {
      credentials: 'include',
    });
    return handleResponse<FollowStatusResponse>(res);
  },

  getFollowers: async (userId: number): Promise<Response<FollowListResponse>> => {
    const res = await fetch(`${BASE}/user/${userId}/followers`, {
      credentials: 'include',
    });
    return handleResponse<FollowListResponse>(res);
  },

  getFollowing: async (userId: number): Promise<Response<FollowListResponse>> => {
    const res = await fetch(`${BASE}/user/${userId}/following`, {
      credentials: 'include',
    });
    return handleResponse<FollowListResponse>(res);
  },
};
