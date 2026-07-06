import { API_CONFIG } from '@/config/api-config';
import { Response, PageResponse } from '@/types/api';
import type {
  PublishArticleRequest,
  PublishArticleResponse,
  ArticlePageItem,
  ArticleDetailResponse,
} from '@/types/article';

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

export const articlesApi = {
  /** 发布文章 */
  publish: async (data: PublishArticleRequest): Promise<Response<PublishArticleResponse>> => {
    const res = await fetch(`${BASE}/articles/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<PublishArticleResponse>(res);
  },

  /** 文章分页列表 */
  page: async (pageNo = 1, pageSize = 10): Promise<Response<PageResponse<ArticlePageItem>>> => {
    const res = await fetch(`${BASE}/articles/page?pageNo=${pageNo}&pageSize=${pageSize}`);
    return handleResponse<PageResponse<ArticlePageItem>>(res);
  },

  /** 文章详情 */
  detail: async (articleId: number): Promise<Response<ArticleDetailResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}`);
    return handleResponse<ArticleDetailResponse>(res);
  },
};
