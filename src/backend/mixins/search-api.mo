import AUTypes  "../types/articles-users-interactions";
import STypes   "../types/search";
import SLib     "../lib/search";
import List     "mo:core/List";
import Map      "mo:core/Map";

/// Public API mixin for search and search history.
/// State slices are injected via mixin parameters.
mixin (
  articles      : List.List<AUTypes.Article>,
  searchHistory : Map.Map<Text, List.List<SLib.SearchEntry>>
) {

  /// Search articles by keyword and optional category.
  /// Stores the query in the caller's search history if authenticated.
  public shared ({ caller }) func searchArticles(
    searchQuery : Text,
    category    : ?Text
  ) : async [AUTypes.Article] {
    // Record search history for authenticated callers
    if (not caller.isAnonymous()) {
      SLib.recordSearch(searchHistory, caller.toText(), searchQuery);
    };
    SLib.searchArticles(articles, searchQuery, category)
  };

  /// Return the calling user's recent search history.
  public shared query ({ caller }) func getSearchHistory() : async [STypes.SearchEntry] {
    if (caller.isAnonymous()) return [];
    SLib.getSearchHistory(searchHistory, caller.toText())
  };
};
