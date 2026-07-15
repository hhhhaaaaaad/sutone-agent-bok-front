const BASE = (typeof window !== 'undefined' && window.__ENV?.NEXT_PUBLIC_API_BASE_URL)
    ? window.__ENV.NEXT_PUBLIC_API_BASE_URL
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8091/api/v1');

export const API_CONFIG = {
  BASE_URL: BASE,
  /** 文件上传访问基址，从 BASE_URL 中切掉 /api/v1 */
  UPLOAD_BASE: BASE.endsWith('/api/v1') ? BASE.slice(0, -7) : BASE,
};
