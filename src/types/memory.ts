export interface MemoryItem {
  id: number;
  type: string;
  content: string;
  score?: number;
  importance?: number;
  accessCount?: number;
  createTime?: string;
}

export interface MemorySearchResponse {
  query: string;
  items: MemoryItem[];
  total: number;
}

export interface MemoryListResponse {
  items: MemoryItem[];
  page: number;
  pageSize: number;
  total: number;
}
