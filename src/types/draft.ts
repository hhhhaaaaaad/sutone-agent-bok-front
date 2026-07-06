/** 与后端 /api/v1/drafts 对应的 DTO */

export interface SaveDraftRequest {
  draftId?: number;
  title?: string;
  contentMd?: string;
  summary?: string;
  coverUrl?: string;
}

export interface SaveDraftResponse {
  draftId: number;
  title: string;
  status: number;
  statusDesc: string;
  lastUpdateTime: string;
}

export interface DraftDetailResponse {
  draftId: number;
  userId: number;
  title: string;
  contentMd: string;
  summary?: string;
  coverUrl?: string;
  status: number;
  statusDesc: string;
  createTime: string;
  updateTime: string;
}

export interface DraftPageItem {
  draftId: number;
  title: string;
  summary?: string;
  coverUrl?: string;
  status: number;
  statusDesc: string;
  updateTime: string;
}
