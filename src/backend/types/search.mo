import Common "common";
import Articles "../types/articles-users-interactions";

module {
  public type ArticleId = Common.ArticleId;

  /// A stored search entry in a user's search history.
  public type SearchEntry = {
    searchTerm : Text;
    timestamp  : Common.Timestamp;
  };

  /// Result type for search — reuses Article from the existing domain.
  public type Article = Articles.Article;
};
