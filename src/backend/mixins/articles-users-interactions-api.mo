import Types  "../types/articles-users-interactions";
import Lib    "../lib/articles-users-interactions";
import List   "mo:core/List";
import Map    "mo:core/Map";
import Time   "mo:core/Time";

/// Public API mixin for the articles / users / interactions domain.
/// State slices are injected via mixin parameters.
mixin (
  articles     : List.List<Lib.Article>,
  users        : Map.Map<Lib.UserId, Lib.User>,
  interactions : List.List<Lib.UserInteraction>
) {

  // ── Article queries ───────────────────────────────────────────────────────

  /// Return all articles without termFrequencies (lighter payload).
  public query func getArticles() : async [Types.Article] {
    let all = Lib.listArticles(articles);
    all.map<Types.Article, Types.Article>(func(a) {
      { a with termFrequencies = [] }
    })
  };

  /// Return a single article by id (with termFrequencies for debugging).
  public query func getArticleDetail(articleId : Types.ArticleId) : async ?Types.Article {
    Lib.getArticle(articles, articleId)
  };

  // ── Recommendation queries ────────────────────────────────────────────────

  /// Get personalised recommendations for a user.
  /// `algorithm` selects the engine: #contentBased | #collaborative | #hybrid.
  /// `seedArticleId` is used by content-based / hybrid when provided.
  public query func getRecommendations(
    userId       : Types.UserId,
    algorithm    : Types.AlgorithmSource,
    seedArticleId: ?Types.ArticleId,
    topN         : Nat
  ) : async Types.RecommendationsResponse {
    let n = if (topN == 0) 5 else topN;
    let recommendations = switch (algorithm) {
      case (#contentBased) {
        let seed = switch (seedArticleId) {
          case (?id) id;
          case null {
            switch (users.get(userId)) {
              case (?u) {
                if (u.interactedArticleIds.size() > 0)
                  u.interactedArticleIds[0]
                else 1
              };
              case null 1;
            };
          };
        };
        Lib.contentBasedRecommendations(articles, seed, n)
      };
      case (#collaborative) {
        Lib.collaborativeRecommendations(users, articles, userId, n)
      };
      case (#hybrid) {
        Lib.hybridRecommendations(users, articles, userId, seedArticleId, n)
      };
    };
    { recommendations; algorithmUsed = algorithm }
  };

  // ── Interaction updates ───────────────────────────────────────────────────

  /// Record a click or like from a user on an article.
  public func recordInteraction(
    req : Types.RecordInteractionRequest
  ) : async () {
    Lib.recordInteraction(
      interactions,
      users,
      req.userId,
      req.articleId,
      req.interactionType,
      Time.now()
    )
  };

  // ── Metrics query ─────────────────────────────────────────────────────────

  /// Return aggregate system metrics.
  public query func getMetrics() : async Types.SystemMetrics {
    Lib.computeMetrics(articles, users, interactions)
  };
};
