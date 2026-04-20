import Common "common";

module {
  // ── Shared aliases ────────────────────────────────────────────────────────
  public type ArticleId = Common.ArticleId;
  public type UserId    = Common.UserId;
  public type Timestamp = Common.Timestamp;

  // ── Core domain types ─────────────────────────────────────────────────────

  /// A news article stored in the system.
  /// `termFrequencies` is a pre-computed sparse TF-IDF vector:
  ///   each entry is (term, weight).
  public type Article = {
    id             : ArticleId;
    title          : Text;
    content        : Text;
    category       : Text;
    termFrequencies: [(Text, Float)];  // sparse TF-IDF vector
  };

  /// The type of user interaction with an article.
  public type InteractionType = {
    #click;
    #like;
  };

  /// A single user–article interaction event.
  public type UserInteraction = {
    userId         : UserId;
    articleId      : ArticleId;
    interactionType: InteractionType;
    timestamp      : Timestamp;
  };

  /// A user profile (derived from interaction history).
  public type User = {
    id                  : UserId;
    interactedArticleIds: [ArticleId];
  };

  /// Which algorithm produced a recommendation.
  public type AlgorithmSource = {
    #contentBased;
    #collaborative;
    #hybrid;
  };

  /// A single recommendation result returned to the frontend.
  public type RecommendationResult = {
    article        : Article;
    score          : Float;    // similarity / relevance score [0.0 – 1.0]
    algorithmSource: AlgorithmSource;
    confidence     : Float;    // confidence in the recommendation [0.0 – 1.0]
  };

  /// Aggregate system-level metrics.
  public type SystemMetrics = {
    totalArticles           : Nat;
    totalUsers              : Nat;
    totalInteractions       : Nat;
    averageSimilarityScore  : Float;
    recommendationCoverage  : Float;  // fraction of articles ever recommended
  };

  // ── Request / response helpers ────────────────────────────────────────────

  /// Request payload for recording an interaction.
  public type RecordInteractionRequest = {
    userId         : UserId;
    articleId      : ArticleId;
    interactionType: InteractionType;
  };

  /// Payload returned by getRecommendations.
  public type RecommendationsResponse = {
    recommendations: [RecommendationResult];
    algorithmUsed  : AlgorithmSource;
  };
};
