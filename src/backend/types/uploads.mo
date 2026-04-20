import Common "common";

module {
  public type ArticleId = Common.ArticleId;
  public type Timestamp = Common.Timestamp;

  /// Valid article categories accepted for upload.
  public type ArticleCategory = {
    #technology;
    #business;
    #health;
    #science;
    #worldNews;
    #sports;
    #entertainment;
  };

  /// Request payload for submitting a new article.
  public type SubmitArticleRequest = {
    title    : Text;
    content  : Text;
    category : Text;   // plain text; validated against ArticleCategory
    tags     : [Text];
  };

  /// Outcome of an article submission.
  public type SubmitArticleResult = {
    #success : { articleId : ArticleId };
    #failure : { reason   : Text };
  };
};
