import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SystemMetrics {
    averageSimilarityScore: number;
    totalArticles: bigint;
    totalUsers: bigint;
    totalInteractions: bigint;
    recommendationCoverage: number;
}
export interface SubmitArticleRequest {
    title: string;
    content: string;
    tags: Array<string>;
    category: string;
}
export type Timestamp = bigint;
export type SubmitArticleResult = {
    __kind__: "failure";
    failure: {
        reason: string;
    };
} | {
    __kind__: "success";
    success: {
        articleId: ArticleId;
    };
};
export interface RecordInteractionRequest {
    interactionType: InteractionType;
    userId: UserId;
    articleId: ArticleId;
}
export type ArticleId = bigint;
export interface RecommendationResult {
    algorithmSource: AlgorithmSource;
    article: Article;
    score: number;
    confidence: number;
}
export type UserId = string;
export interface UpdateProfileRequest {
    region?: string;
    displayName?: string;
    preferredCategories?: Array<string>;
    interests?: Array<string>;
}
export interface RecommendationsResponse {
    algorithmUsed: AlgorithmSource;
    recommendations: Array<RecommendationResult>;
}
export interface SearchEntry {
    searchTerm: string;
    timestamp: Timestamp;
}
export interface Article {
    id: ArticleId;
    title: string;
    content: string;
    category: string;
    termFrequencies: Array<[string, number]>;
}
export interface UserProfile {
    region: string;
    readingHistory: Array<ArticleId>;
    displayName: string;
    preferredCategories: Array<string>;
    interests: Array<string>;
    createdAt: Timestamp;
    principalText: string;
}
export enum AlgorithmSource {
    hybrid = "hybrid",
    collaborative = "collaborative",
    contentBased = "contentBased"
}
export enum InteractionType {
    like = "like",
    click = "click"
}
export interface backendInterface {
    getArticleDetail(articleId: ArticleId): Promise<Article | null>;
    getArticleLikeCount(articleId: ArticleId): Promise<bigint>;
    getArticles(): Promise<Array<Article>>;
    getMetrics(): Promise<SystemMetrics>;
    getRecommendations(userId: UserId, algorithm: AlgorithmSource, seedArticleId: ArticleId | null, topN: bigint): Promise<RecommendationsResponse>;
    getSearchHistory(): Promise<Array<SearchEntry>>;
    getTrendingArticles(limit: bigint | null): Promise<Array<Article>>;
    getUserLikes(): Promise<Array<ArticleId>>;
    getUserProfile(): Promise<UserProfile>;
    recordInteraction(req: RecordInteractionRequest): Promise<void>;
    recordProfileInteraction(articleId: ArticleId): Promise<void>;
    searchArticles(searchQuery: string, category: string | null): Promise<Array<Article>>;
    submitArticle(req: SubmitArticleRequest): Promise<SubmitArticleResult>;
    toggleArticleLike(articleId: ArticleId): Promise<bigint>;
    updateUserProfile(req: UpdateProfileRequest): Promise<UserProfile>;
}
