export interface CommentPublishRequest {
  content: string;
  parentId?: number;
}

export interface CommentItemResponse {
  commentId: number;
  articleId: number;
  authorId: number;
  authorName: string;
  avatarUrl?: string;
  content: string;
  parentId?: number;
  likeCount: number;
  liked: boolean;
  createTime: string;
  replies: CommentItemResponse[];
}

export interface CommentPageResponse {
  list: CommentItemResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CommentLikeResponse {
  liked: boolean;
  likeCount: number;
}
