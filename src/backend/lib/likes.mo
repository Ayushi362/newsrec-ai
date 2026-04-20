import AUTypes "../types/articles-users-interactions";
import AULib   "../lib/articles-users-interactions";
import Map     "mo:core/Map";
import Set     "mo:core/Set";
import List    "mo:core/List";
import Time    "mo:core/Time";

/// Domain-logic module for per-article like/unlike by authenticated users.
/// Stateless — state is injected via parameters.
module {
  public type ArticleId       = AUTypes.ArticleId;
  public type UserInteraction = AUTypes.UserInteraction;

  /// Toggle a like for (principalText, articleId).
  /// Returns the updated total like count for the article.
  public func toggleLike(
    likes         : Map.Map<ArticleId, Set.Set<Text>>,
    interactions  : List.List<UserInteraction>,
    users         : Map.Map<Text, AUTypes.User>,
    principalText : Text,
    articleId     : ArticleId
  ) : Nat {
    let likerSet : Set.Set<Text> = switch (likes.get(articleId)) {
      case (?s) s;
      case null {
        let s = Set.empty<Text>();
        likes.add(articleId, s);
        s
      };
    };
    if (likerSet.contains(principalText)) {
      // Unlike
      likerSet.remove(principalText);
    } else {
      // Like — add to set and record interaction
      likerSet.add(principalText);
      AULib.recordInteraction(
        interactions,
        users,
        principalText,
        articleId,
        #like,
        Time.now()
      );
    };
    likerSet.size()
  };

  /// Return like count for an article.
  public func getLikeCount(
    likes     : Map.Map<ArticleId, Set.Set<Text>>,
    articleId : ArticleId
  ) : Nat {
    switch (likes.get(articleId)) {
      case (?s) s.size();
      case null 0;
    }
  };

  /// Return whether the given principal has liked an article.
  public func hasLiked(
    likes         : Map.Map<ArticleId, Set.Set<Text>>,
    principalText : Text,
    articleId     : ArticleId
  ) : Bool {
    switch (likes.get(articleId)) {
      case (?s) s.contains(principalText);
      case null false;
    }
  };
};
