export interface NotificationItem {
  id: number;
  type: string;
  senderId?: number;
  senderName?: string;
  avatarUrl?: string;
  refId?: number;
  content?: string;
  isRead: boolean;
  createTime: string;
}

export interface NotificationPageResponse {
  list: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
