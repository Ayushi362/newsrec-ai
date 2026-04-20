import Types     "../types/profiles";
import Lib       "../lib/profiles";
import Map       "mo:core/Map";

/// Public API mixin for user profiles.
/// State slices are injected via mixin parameters.
mixin (
  profiles : Map.Map<Text, Lib.UserProfile>
) {

  /// Return the profile for the calling principal.
  /// Creates and returns a default profile if none exists yet.
  public shared ({ caller }) func getUserProfile() : async Types.UserProfile {
    if (caller.isAnonymous()) {
      return {
        principalText    = "anonymous";
        displayName      = "Guest";
        region           = "";
        interests        = [];
        preferredCategories = [];
        readingHistory   = [];
        createdAt        = 0;
      };
    };
    Lib.createOrGetProfile(profiles, caller.toText())
  };

  /// Update preferences for the calling principal.
  public shared ({ caller }) func updateUserProfile(
    req : Types.UpdateProfileRequest
  ) : async Types.UserProfile {
    if (caller.isAnonymous()) {
      return {
        principalText    = "anonymous";
        displayName      = "Guest";
        region           = "";
        interests        = [];
        preferredCategories = [];
        readingHistory   = [];
        createdAt        = 0;
      };
    };
    Lib.updateProfile(profiles, caller.toText(), req)
  };

  /// Called after reading an article to update reading history.
  public shared ({ caller }) func recordProfileInteraction(
    articleId : Types.ArticleId
  ) : async () {
    if (caller.isAnonymous()) return;
    Lib.recordRead(profiles, caller.toText(), articleId)
  };
};
