import List "mo:core/List";
import Map  "mo:core/Map";
import Set  "mo:core/Set";

import AULib      "lib/articles-users-interactions";
import AUApi      "mixins/articles-users-interactions-api";
import ProfilesApi "mixins/profiles-api";
import SearchApi   "mixins/search-api";
import UploadsApi  "mixins/uploads-api";
import LikesApi    "mixins/likes-api";

import ProfileTypes "types/profiles";
import SearchTypes  "types/search";

actor {
  // ── Core state (articles / users / interactions) ────────────────────────
  let articles     : List.List<AULib.Article>               = List.empty();
  let users        : Map.Map<AULib.UserId, AULib.User>      = Map.empty();
  let interactions : List.List<AULib.UserInteraction>       = List.empty();

  // ── Auto-increment ID for uploaded articles ──────────────────────────────
  let nextArticleId : { var value : Nat } = { var value = 21 };

  // ── User profile state (keyed by principal.toText()) ────────────────────
  let profiles : Map.Map<Text, ProfileTypes.UserProfile> = Map.empty();

  // ── Search history state (keyed by principal.toText()) ──────────────────
  let searchHistory : Map.Map<Text, List.List<SearchTypes.SearchEntry>> = Map.empty();

  // ── Like state: articleId → set of principal texts that liked it ─────────
  let likes : Map.Map<AULib.ArticleId, Set.Set<Text>> = Map.empty();

  // ── Seed demo data (idempotent: only seeds when empty) ───────────────────
  if (articles.size() == 0) {
    AULib.seedData(articles, users, interactions);
  };

  // ── Mixin composition ────────────────────────────────────────────────────
  include AUApi(articles, users, interactions);
  include ProfilesApi(profiles);
  include SearchApi(articles, searchHistory);
  include UploadsApi(articles, interactions, nextArticleId);
  include LikesApi(likes, interactions, users);
};
