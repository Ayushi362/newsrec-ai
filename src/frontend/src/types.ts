export type ArticleId = string;
export type UserId = string;

export interface Article {
  id: ArticleId;
  title: string;
  content: string;
  category: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  likeCount: number;
  tags: string[];
  termFrequencies?: Array<[string, number]>;
}

export interface UserProfile {
  id: UserId;
  name: string;
  region: string;
  interests: string[];
  likedArticles: string[];
  readHistory: string[];
  searchHistory: string[];
  preferredCategories?: string[];
}

export type InteractionType = "like" | "read" | "click" | "search";

export interface Interaction {
  userId: UserId;
  articleId: ArticleId;
  type: InteractionType;
  timestamp: number;
}

export interface SearchQuery {
  query: string;
  category?: string;
  timestamp: number;
}

export interface SystemMetrics {
  totalArticles: number;
  totalUsers: number;
  totalInteractions: number;
  averageSimilarityScore: number;
  recommendationCoverage: number;
  topCategories: Array<{ category: string; count: number }>;
  interactionsByType: Record<InteractionType, number>;
}

export interface RecommendationResult {
  article: Article;
  score: number;
  reason: string;
}

export interface SubmitArticleRequest {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export type SubmitArticleResult =
  | { kind: "success"; articleId: ArticleId }
  | { kind: "failure"; reason: string };

export const USER_IDS: UserId[] = ["user1", "user2", "user3", "user4", "user5"];

export const CATEGORIES = [
  "Technology",
  "Business",
  "Health",
  "Science",
  "Sports",
  "Entertainment",
  "Politics",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const REGIONS = [
  "North America",
  "Europe",
  "Asia",
  "South America",
  "Africa",
] as const;

export type Region = (typeof REGIONS)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Technology: "border-l-accent text-accent",
  Business: "border-l-chart-3 text-chart-3",
  Health: "border-l-chart-5 text-chart-5",
  Science: "border-l-chart-2 text-chart-2",
  Sports: "border-l-primary text-primary",
  Entertainment: "border-l-chart-4 text-chart-4",
  Politics: "border-l-chart-1 text-chart-1",
};
