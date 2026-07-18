import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { NotificationPageResponse, UnreadCountResponse } from '@/types/notification';

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

export const notificationApi = {
  list: async (page = 1, pageSize = 10): Promise<Response<NotificationPageResponse>> => {
    const res = await fetch(`${BASE}/notifications?page=${page}&pageSize=${pageSize}`, {
      credentials: 'include',
    });
    return handleResponse<NotificationPageResponse>(res);
  },

  unreadCount: async (): Promise<Response<UnreadCountResponse>> => {
    const res = await fetch(`${BASE}/notifications/unread-count`, {
      credentials: 'include',
    });
    return handleResponse<UnreadCountResponse>(res);
  },

  markRead: async (id: number): Promise<Response<void>> => {
    const res = await fetch(`${BASE}/notifications/${id}/read`, {
      credentials: 'include',
      method: 'PUT',
    });
    return handleResponse(res);
  },

  markAllRead: async (): Promise<Response<void>> => {
    const res = await fetch(`${BASE}/notifications/read-all`, {
      credentials: 'include',
      method: 'PUT',
    });
    return handleResponse(res);
  },
};
