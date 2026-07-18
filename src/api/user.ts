import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { UserInfo } from '@/types/user';

const BASE = API_CONFIG.BASE_URL;

export const userApi = {
  getUserById: async (userId: number): Promise<Response<UserInfo>> => {
    const res = await fetch(`${BASE}/user/${userId}`, { credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.code !== '0000') throw new Error(json.info || 'API error');
    return json;
  },
};
