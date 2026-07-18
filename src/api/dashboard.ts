import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { DashboardOverview, TrendDataPoint } from '@/types/dashboard';

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

export const dashboardApi = {
  overview: async (): Promise<Response<DashboardOverview>> => {
    const res = await fetch(`${BASE}/dashboard/overview`, { credentials: 'include' });
    return handleResponse<DashboardOverview>(res);
  },

  trend: async (days = 7): Promise<Response<TrendDataPoint[]>> => {
    const res = await fetch(`${BASE}/dashboard/trend?days=${days}`, { credentials: 'include' });
    return handleResponse(res);
  },
};
