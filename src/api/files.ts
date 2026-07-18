import { API_CONFIG } from '@/config/api-config';
import { Response } from '@/types/api';

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

export const filesApi = {
  /** 上传文件，返回 { url, filename } */
  upload: async (file: File): Promise<Response<{ url: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/files/upload`, {
      credentials: 'include',
      method: 'POST',
      body: formData,
    });
    return handleResponse<{ url: string; filename: string }>(res);
  },
};
