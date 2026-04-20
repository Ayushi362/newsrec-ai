import AUTypes  "../types/articles-users-interactions";
import UpTypes  "../types/uploads";
import UpLib    "../lib/uploads";
import List     "mo:core/List";

/// Public API mixin for article upload and trending.
/// State slices are injected via mixin parameters.
mixin (
  articles      : List.List<AUTypes.Article>,
  interactions  : List.List<AUTypes.UserInteraction>,
  nextArticleId : { var value : Nat }
) {

  /// Submit a new article. Caller must be authenticated.
  /// Validates content and runs TF-IDF on success.
  public shared ({ caller }) func submitArticle(
    req : UpTypes.SubmitArticleRequest
  ) : async UpTypes.SubmitArticleResult {
    if (caller.isAnonymous()) {
      return #failure { reason = "Authentication required to submit articles" };
    };
    let result = UpLib.submitArticle(
      articles,
      nextArticleId.value,
      caller.toText(),
      req
    );
    // Increment counter only on success
    switch (result) {
      case (#success _) { nextArticleId.value += 1 };
      case (#failure _) {};
    };
    result
  };

  /// Return articles sorted by interaction count. Default limit is 10.
  public query func getTrendingArticles(limit : ?Nat) : async [AUTypes.Article] {
    let l = switch (limit) { case (?n) n; case null 10 };
    UpLib.getTrending(articles, interactions, l)
  };
};
