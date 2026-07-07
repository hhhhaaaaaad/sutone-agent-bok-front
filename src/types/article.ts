/** 与后端 /api/v1/articles 对应的 DTO */

export interface PublishArticleRequest {
  draftId: number;
  tags?: string[];
}

export interface PublishArticleResponse {
  articleId: number;
  draftId: number;
  articleUrl: string;
  publishTime: string;
}

export interface ArticlePageItem {
  articleId: number;
  authorId: number;
  authorName: string;
  avatarUrl?: string;
  title: string;
  summary?: string;
  coverUrl?: string;
  publishTime: string;
  viewCount: number;
  tags: string[];
}

export interface ArticleDetailResponse {
  articleId: number;
  authorId: number;
  authorName?: string;
  avatarUrl?: string;
  title: string;
  summary?: string;
  contentMd: string;
  contentHtml?: string;
  coverUrl?: string;
  publishTime: string;
  viewCount: number;
  likeCount: number;
  favoriteCount: number;
  tags: string[];
}

export interface RevertToDraftResponse {
  draftId: number;
}
