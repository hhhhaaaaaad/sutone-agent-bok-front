export interface DashboardOverview {
  articleCount: number;
  totalViews: number;
  totalLikes: number;
  totalFavorites: number;
  totalComments: number;
}

export interface TrendDataPoint {
  date: string;
  likes: number;
  favorites: number;
  comments: number;
}
