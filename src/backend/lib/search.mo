import Types   "../types/search";
import AUTypes "../types/articles-users-interactions";
import Map     "mo:core/Map";
import List    "mo:core/List";
import Time    "mo:core/Time";
import Text    "mo:core/Text";

/// Domain-logic module for search and search history.
/// Stateless — state is injected via parameters.
module {
  public type Article     = AUTypes.Article;
  public type SearchEntry = Types.SearchEntry;

  /// Tokenize a text query into lowercase alpha tokens >= 2 chars.
  func tokenizeQuery(text : Text) : [Text] {
    let lower = text.toLower();
    let tokens : List.List<Text> = List.empty();
    var current : List.List<Char> = List.empty();
    for (c in lower.toIter()) {
      if (c >= 'a' and c <= 'z') {
        current.add(c);
      } else {
        if (current.size() >= 2) {
          tokens.add(Text.fromIter(current.values()));
        };
        current := List.empty();
      };
    };
    if (current.size() >= 2) {
      tokens.add(Text.fromIter(current.values()));
    };
    tokens.toArray()
  };

  /// Filter articles by keyword query (title + content) and optional category.
  public func searchArticles(
    articles     : List.List<Article>,
    searchQuery  : Text,
    category     : ?Text
  ) : [Article] {
    let tokens = tokenizeQuery(searchQuery);
    if (tokens.size() == 0) return [];
    let allArticles = articles.toArray();
    let results = allArticles.filter(func(a : Article) : Bool {
      // Category filter
      let catMatch = switch (category) {
        case (?cat) {
          if (cat == "") true
          else a.category.toLower() == cat.toLower()
        };
        case null true;
      };
      if (not catMatch) return false;
      // Token match: at least one token appears in title or content
      let combined = (a.title # " " # a.content).toLower();
      tokens.any(func(tok : Text) : Bool {
        combined.contains(#text tok)
      })
    });
    results
  };

  /// Append a search query to the user's history. Keeps last 10 entries.
  public func recordSearch(
    searchHistory : Map.Map<Text, List.List<SearchEntry>>,
    principalText : Text,
    searchQuery   : Text
  ) : () {
    let entry : SearchEntry = { searchTerm = searchQuery; timestamp = Time.now() };
    switch (searchHistory.get(principalText)) {
      case (?history) {
        history.add(entry);
        // Trim to last 10 entries if over limit
        if (history.size() > 10) {
          let arr = history.toArray();
          let start : Nat = if (arr.size() > 10) arr.size() - 10 else 0;
          let trimmed = arr.sliceToArray(start, arr.size());
          history.clear();
          for (e in trimmed.values()) { history.add(e) };
        };
      };
      case null {
        let newList : List.List<SearchEntry> = List.empty();
        newList.add(entry);
        searchHistory.add(principalText, newList);
      };
    };
  };

  /// Return the recent search history for a user (newest first, max 10).
  public func getSearchHistory(
    searchHistory : Map.Map<Text, List.List<SearchEntry>>,
    principalText : Text
  ) : [SearchEntry] {
    switch (searchHistory.get(principalText)) {
      case (?history) history.toArray().reverse();
      case null [];
    }
  };
};
