import Common "common";

module {
  public type ArticleId = Common.ArticleId;
  public type Timestamp = Common.Timestamp;

  /// Full user profile keyed by principal text.
  public type UserProfile = {
    principalText    : Text;
    displayName      : Text;
    region           : Text;
    interests        : [Text];
    preferredCategories : [Text];
    readingHistory   : [ArticleId];
    createdAt        : Timestamp;
  };

  /// Request payload for updating a user profile.
  public type UpdateProfileRequest = {
    displayName         : ?Text;
    region              : ?Text;
    interests           : ?[Text];
    preferredCategories : ?[Text];
  };
};
