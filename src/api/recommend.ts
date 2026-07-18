import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';
import type { ArticlePageItem } from '@/types/article';

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

export const recommendApi = {
  recommend: async (n = 10): Promise<Response<ArticlePageItem[]>> => {
    const res = await fetch(`${BASE}/articles/recommend?n=${n}`, {
      credentials: 'include',
    });
    return handleResponse<ArticlePageItem[]>(res);
  },
};
