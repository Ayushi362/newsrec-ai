import UpTypes "../types/uploads";
import AUTypes "../types/articles-users-interactions";
import AULib   "../lib/articles-users-interactions";
import List    "mo:core/List";
import Map     "mo:core/Map";
import Nat     "mo:core/Nat";
import Text    "mo:core/Text";

/// Domain-logic module for article upload and validation.
/// Stateless — state is injected via parameters.
module {
  public type Article              = AUTypes.Article;
  public type SubmitArticleRequest = UpTypes.SubmitArticleRequest;
  public type SubmitArticleResult  = UpTypes.SubmitArticleResult;

  let validCategories : [Text] = [
    "technology", "business", "health", "science",
    "world", "sports", "entertainment",
  ];

  let spamKeywords : [Text] = [
    "buy now", "click here", "limited offer",
    "act now", "free money", "make money fast",
  ];

  /// Validate and persist a new article.
  /// Returns #failure with a specific message on validation error.
  /// On success computes TF-IDF and stores the article.
  public func submitArticle(
    articles      : List.List<Article>,
    nextId        : Nat,
    _principalText : Text,
    req           : SubmitArticleRequest
  ) : SubmitArticleResult {
    // 1. Title length
    if (req.title.size() < 3) {
      return #failure { reason = "Title too short (minimum 3 characters)" };
    };
    // 2. Content length
    let contentLen = req.content.size();
    if (contentLen < 100) {
      return #failure {
        reason = "Content too short (" # contentLen.toText() # "/100 characters)"
      };
    };
    // 3. Category validation
    let catLower = req.category.toLower();
    let catValid = validCategories.any(func(c : Text) : Bool { c == catLower });
    if (not catValid) {
      return #failure { reason = "Invalid category selected" };
    };
    // 4. Spam keyword check
    let combined = (req.title # " " # req.content).toLower();
    for (kw in spamKeywords.values()) {
      if (combined.contains(#text kw)) {
        return #failure { reason = "Spam keywords detected: " # kw };
      };
    };

    // Build article stub (TF-IDF computed after insertion)
    let newArticle : Article = {
      id              = nextId;
      title           = req.title;
      content         = req.content;
      category        = req.category;
      termFrequencies = [];
    };
    articles.add(newArticle);
    // Recompute TF-IDF for all articles so vectors stay consistent
    AULib.computeAllTfIdf(articles);

    #success { articleId = nextId }
  };

  /// Return articles sorted by total interaction count descending.
  public func getTrending(
    articles     : List.List<Article>,
    interactions : List.List<AUTypes.UserInteraction>,
    limit        : Nat
  ) : [Article] {
    let countMap = Map.empty<AUTypes.ArticleId, Nat>();
    let allInteractions = interactions.toArray();
    for (inter in allInteractions.values()) {
      let prev = switch (countMap.get(inter.articleId)) {
        case (?c) c;
        case null 0;
      };
      countMap.add(inter.articleId, prev + 1);
    };

    // Sort all articles by interaction count descending
    let allArticles = articles.toArray();
    let sorted = allArticles.sort(func(a : Article, b : Article) : { #less; #equal; #greater } {
      let ca = switch (countMap.get(a.id)) { case (?c) c; case null 0 };
      let cb = switch (countMap.get(b.id)) { case (?c) c; case null 0 };
      if (cb > ca) #less
      else if (cb < ca) #greater
      else #equal
    });
    // Strip termFrequencies for lighter payload, take limit
    let effectiveLimit = if (limit == 0) 10 else limit;
    sorted.sliceToArray(0, Nat.min(effectiveLimit, sorted.size())).map<Article, Article>(func(a) {
      { a with termFrequencies = [] }
    })
  };
};
