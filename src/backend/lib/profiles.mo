import Types  "../types/profiles";
import Map    "mo:core/Map";
import List   "mo:core/List";
import Time   "mo:core/Time";

/// Domain-logic module for user profiles.
/// Stateless — state is injected via parameters.
module {
  public type UserProfile          = Types.UserProfile;
  public type UpdateProfileRequest = Types.UpdateProfileRequest;
  public type ArticleId            = Types.ArticleId;

  /// Retrieve a profile by principal text. Returns null if not found.
  public func getProfile(
    profiles      : Map.Map<Text, UserProfile>,
    principalText : Text
  ) : ?UserProfile {
    profiles.get(principalText)
  };

  /// Create a default profile for a new principal and store it.
  public func createDefault(
    profiles      : Map.Map<Text, UserProfile>,
    principalText : Text
  ) : UserProfile {
    let profile : UserProfile = {
      principalText;
      displayName         = "User";
      region              = "";
      interests           = [];
      preferredCategories = [];
      readingHistory      = [];
      createdAt           = Time.now();
    };
    profiles.add(principalText, profile);
    profile
  };

  /// Return existing profile or create a default one.
  public func createOrGetProfile(
    profiles      : Map.Map<Text, UserProfile>,
    principalText : Text
  ) : UserProfile {
    switch (profiles.get(principalText)) {
      case (?p) p;
      case null createDefault(profiles, principalText);
    }
  };

  /// Apply a partial update to an existing profile.
  /// Creates a default profile first if none exists.
  public func updateProfile(
    profiles      : Map.Map<Text, UserProfile>,
    principalText : Text,
    req           : UpdateProfileRequest
  ) : UserProfile {
    let existing = createOrGetProfile(profiles, principalText);
    let updated : UserProfile = {
      existing with
      displayName         = switch (req.displayName)         { case (?v) v; case null existing.displayName         };
      region              = switch (req.region)              { case (?v) v; case null existing.region              };
      interests           = switch (req.interests)           { case (?v) v; case null existing.interests           };
      preferredCategories = switch (req.preferredCategories) { case (?v) v; case null existing.preferredCategories };
    };
    profiles.add(principalText, updated);
    updated
  };

  /// Record that a principal has read an article, appending to readingHistory (max 20).
  public func recordRead(
    profiles      : Map.Map<Text, UserProfile>,
    principalText : Text,
    articleId     : ArticleId
  ) : () {
    let existing = createOrGetProfile(profiles, principalText);
    // Avoid duplicates — append only if not already in history
    let alreadyPresent = existing.readingHistory.find(func(id : ArticleId) : Bool { id == articleId });
    if (alreadyPresent != null) return;
    // Trim to last 20 entries (keep most recent, append new at end)
    let history = existing.readingHistory;
    let newHistory = if (history.size() >= 20) {
      history.sliceToArray(history.size() - 19 : Int, history.size()).concat([articleId])
    } else {
      history.concat([articleId])
    };
    profiles.add(principalText, { existing with readingHistory = newHistory });
  };
};
