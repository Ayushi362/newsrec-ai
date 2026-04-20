import AUTypes  "../types/articles-users-interactions";
import LLib     "../lib/likes";
import Map      "mo:core/Map";
import Set      "mo:core/Set";
import List     "mo:core/List";

/// Public API mixin for article likes.
/// State slices are injected via mixin parameters.
mixin (
  likes        : Map.Map<AUTypes.ArticleId, Set.Set<Text>>,
  interactions : List.List<AUTypes.UserInteraction>,
  users        : Map.Map<Text, AUTypes.User>
) {

  /// Toggle a like for the calling principal on the given article.
  /// Returns the updated like count.
  public shared ({ caller }) func toggleArticleLike(
    articleId : AUTypes.ArticleId
  ) : async Nat {
    if (caller.isAnonymous()) {
      return LLib.getLikeCount(likes, articleId);
    };
    LLib.toggleLike(likes, interactions, users, caller.toText(), articleId)
  };

  /// Return the like count for an article (unauthenticated, query).
  public query func getArticleLikeCount(
    articleId : AUTypes.ArticleId
  ) : async Nat {
    LLib.getLikeCount(likes, articleId)
  };

  /// Return article IDs liked by the calling user.
  public shared query ({ caller }) func getUserLikes() : async [AUTypes.ArticleId] {
    if (caller.isAnonymous()) return [];
    let callerText = caller.toText();
    let result : List.List<AUTypes.ArticleId> = List.empty();
    for ((articleId, likerSet) in likes.entries()) {
      if (likerSet.contains(callerText)) {
        result.add(articleId);
      };
    };
    result.toArray()
  };
};
