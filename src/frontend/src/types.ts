export type ArticleId = bigint;
export type UserId = string;
export type Timestamp = bigint;

export interface Article {
  id: ArticleId;
  title: string;
  content: string;
  category: string;
  termFrequencies: Array<[string, number]>;
}

export enum AlgorithmSource {
  hybrid = "hybrid",
  collaborative = "collaborative",
  contentBased = "contentBased",
}

export enum InteractionType {
  like = "like",
  click = "click",
}

export interface RecommendationResult {
  algorithmSource: AlgorithmSource;
  article: Article;
  score: number;
  confidence: number;
}

export interface RecommendationsResponse {
  algorithmUsed: AlgorithmSource;
  recommendations: Array<RecommendationResult>;
}

export interface SystemMetrics {
  averageSimilarityScore: number;
  totalArticles: bigint;
  totalUsers: bigint;
  totalInteractions: bigint;
  recommendationCoverage: number;
}

export interface RecordInteractionRequest {
  interactionType: InteractionType;
  userId: UserId;
  articleId: ArticleId;
}

export interface UserProfile {
  principalText: string;
  displayName: string;
  region: string;
  interests: string[];
  preferredCategories: string[];
  readingHistory: bigint[];
  createdAt: Timestamp;
}

export interface UpdateProfileRequest {
  displayName?: string;
  region?: string;
  interests?: string[];
  preferredCategories?: string[];
}

export interface SearchEntry {
  query: string;
  timestamp: Timestamp;
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
  "World",
  "Sports",
  "Entertainment",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const REGIONS = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East",
  "Africa",
] as const;

export type Region = (typeof REGIONS)[number];

export const ALGORITHM_LABELS: Record<AlgorithmSource, string> = {
  [AlgorithmSource.contentBased]: "Content-Based",
  [AlgorithmSource.collaborative]: "Collaborative",
  [AlgorithmSource.hybrid]: "Hybrid",
};

export const ALGORITHM_COLORS: Record<AlgorithmSource, string> = {
  [AlgorithmSource.contentBased]: "text-accent border-accent/40 bg-accent/10",
  [AlgorithmSource.collaborative]:
    "text-primary border-primary/40 bg-primary/10",
  [AlgorithmSource.hybrid]: "text-chart-3 border-chart-3/40 bg-chart-3/10",
};

export const CATEGORY_COLORS: Record<string, string> = {
  Technology: "border-l-accent text-accent",
  Finance: "border-l-chart-3 text-chart-3",
  Politics: "border-l-chart-4 text-chart-4",
  Science: "border-l-chart-2 text-chart-2",
  Health: "border-l-chart-5 text-chart-5",
  Sports: "border-l-primary text-primary",
  Business: "border-l-chart-3 text-chart-3",
  World: "border-l-muted-foreground text-muted-foreground",
  Entertainment: "border-l-chart-4 text-chart-4",
  "World News": "border-l-muted-foreground text-muted-foreground",
};
