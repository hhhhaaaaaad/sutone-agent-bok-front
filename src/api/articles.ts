import { API_CONFIG } from '@/config/api-config';
import { Response, PageResponse } from '@/types/api';
import type {
  PublishArticleRequest,
  PublishArticleResponse,
  ArticlePageItem,
  ArticleDetailResponse,
  RevertToDraftResponse,
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
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<PublishArticleResponse>(res);
  },

  /** 文章分页列表 */
  page: async (params: {
    pageNo?: number;
    pageSize?: number;
    userId?: number;
    keyword?: string;
  } = {}): Promise<Response<PageResponse<ArticlePageItem>>> => {
    const { pageNo = 1, pageSize = 10, userId, keyword } = params;
    const searchParams = new URLSearchParams();
    searchParams.set("pageNo", String(pageNo));
    searchParams.set("pageSize", String(pageSize));
    if (userId) searchParams.set("userId", String(userId));
    if (keyword) searchParams.set("keyword", keyword);
    const res = await fetch(`${BASE}/articles/page?${searchParams}`, {
      credentials: "include",
    });
    return handleResponse<PageResponse<ArticlePageItem>>(res);
  },

  /** 文章详情 */
  detail: async (articleId: number): Promise<Response<ArticleDetailResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}`, {
      credentials: "include",
    });
    return handleResponse<ArticleDetailResponse>(res);
  },

  /** 将已发布文章回退到草稿状态 */
  revertToDraft: async (articleId: number): Promise<Response<RevertToDraftResponse>> => {
    const res = await fetch(`${BASE}/articles/${articleId}/revert-to-draft`, {
      credentials: 'include',
      method: 'POST',
    });
    return handleResponse<RevertToDraftResponse>(res);
  },
};
