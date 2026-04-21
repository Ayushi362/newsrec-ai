import type { Article, RecommendationResult, UserProfile } from "@/types";

// --- TF-IDF Utilities ---

function tokenize(text: string): string[] {
  const stopwords = new Set([
    "the",
    "a",
    "an",
    "is",
    "it",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "and",
    "or",
    "but",
    "with",
    "has",
    "have",
    "be",
    "been",
    "was",
    "were",
    "are",
    "that",
    "this",
    "which",
    "its",
    "their",
    "our",
    "we",
    "he",
    "she",
    "they",
    "by",
    "from",
    "as",
    "more",
    "also",
    "new",
    "says",
    "said",
    "will",
    "would",
    "his",
    "her",
    "not",
    "than",
    "all",
    "one",
    "two",
    "three",
    "four",
    "five",
    "after",
    "before",
    "over",
    "under",
    "up",
    "out",
    "about",
    "into",
    "can",
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
}

export function tfidfVectorize(
  text: string,
  corpus: string[],
): Map<string, number> {
  const tokens = tokenize(text);
  const totalDocs = corpus.length;
  const termFreq = new Map<string, number>();

  for (const token of tokens) {
    termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
  }

  const tfIdf = new Map<string, number>();
  for (const [term, tf] of termFreq) {
    const docsWithTerm = corpus.filter((doc) =>
      tokenize(doc).includes(term),
    ).length;
    const idf = Math.log((totalDocs + 1) / (docsWithTerm + 1)) + 1;
    tfIdf.set(term, (tf / tokens.length) * idf);
  }
  return tfIdf;
}

export function cosineSimilarity(
  vec1: Map<string, number>,
  vec2: Map<string, number>,
): number {
  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const [term, val1] of vec1) {
    const val2 = vec2.get(term) ?? 0;
    dot += val1 * val2;
    mag1 += val1 * val1;
  }
  for (const val2 of vec2.values()) {
    mag2 += val2 * val2;
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude === 0 ? 0 : dot / magnitude;
}

// --- Content-Based Filtering ---

export function contentBasedRecs(
  article: Article,
  allArticles: Article[],
  userProfile: UserProfile | null,
  topN = 5,
): RecommendationResult[] {
  const corpus = allArticles.map(
    (a) => `${a.title} ${a.content} ${a.tags.join(" ")}`,
  );
  const targetText = `${article.title} ${article.content} ${article.tags.join(" ")}`;
  const targetVec = tfidfVectorize(targetText, corpus);

  const scored = allArticles
    .filter((a) => a.id !== article.id)
    .map((a) => {
      const text = `${a.title} ${a.content} ${a.tags.join(" ")}`;
      const vec = tfidfVectorize(text, corpus);
      let score = cosineSimilarity(targetVec, vec);

      // Boost same-category
      if (a.category === article.category) score *= 1.3;

      // Boost by user interests
      if (userProfile?.interests.includes(a.category)) score *= 1.15;

      return {
        article: a,
        score: Math.min(score, 1),
        reason: `Similar to "${article.title.slice(0, 30)}…"`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}

// --- Collaborative Filtering ---

function jaccardSimilarity(setA: string[], setB: string[]): number {
  const a = new Set(setA);
  const b = new Set(setB);
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function collaborativeRecs(
  userId: string,
  allUsers: UserProfile[],
  allArticles: Article[],
  topN = 5,
): RecommendationResult[] {
  const currentUser = allUsers.find((u) => u.id === userId);
  if (!currentUser) return [];

  // Compute similarity between current user and all others
  const similarities = allUsers
    .filter((u) => u.id !== userId)
    .map((u) => ({
      user: u,
      similarity:
        jaccardSimilarity(currentUser.likedArticles, u.likedArticles) * 0.5 +
        jaccardSimilarity(currentUser.readHistory, u.readHistory) * 0.5,
    }))
    .sort((a, b) => b.similarity - a.similarity);

  // Aggregate article scores from similar users
  const articleScores = new Map<string, number>();
  for (const { user, similarity } of similarities) {
    for (const articleId of [...user.likedArticles, ...user.readHistory]) {
      if (!currentUser.readHistory.includes(articleId)) {
        const current = articleScores.get(articleId) ?? 0;
        articleScores.set(articleId, current + similarity);
      }
    }
  }

  return [...articleScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, score]) => {
      const article = allArticles.find((a) => a.id === id);
      if (!article) return null;
      return {
        article,
        score: Math.min(score, 1),
        reason: "Popular with readers like you",
      };
    })
    .filter((r): r is RecommendationResult => r !== null);
}

// --- Hybrid Recommendations ---

export function hybridRecs(
  userId: string,
  articleId: string | null,
  allUsers: UserProfile[],
  allArticles: Article[],
  userProfile: UserProfile | null,
  topN = 8,
): RecommendationResult[] {
  const contentWeight = 0.45;
  const colabWeight = 0.35;
  const popularityWeight = 0.2;

  const colabResults = collaborativeRecs(
    userId,
    allUsers,
    allArticles,
    topN * 2,
  );

  let contentResults: RecommendationResult[] = [];
  if (articleId) {
    const article = allArticles.find((a) => a.id === articleId);
    if (article) {
      contentResults = contentBasedRecs(
        article,
        allArticles,
        userProfile,
        topN * 2,
      );
    }
  }

  // Merge scores
  const combined = new Map<
    string,
    { article: Article; score: number; reasons: string[] }
  >();

  for (const r of colabResults) {
    combined.set(r.article.id, {
      article: r.article,
      score: r.score * colabWeight,
      reasons: [r.reason],
    });
  }

  for (const r of contentResults) {
    const existing = combined.get(r.article.id);
    if (existing) {
      existing.score += r.score * contentWeight;
      existing.reasons.push(r.reason);
    } else {
      combined.set(r.article.id, {
        article: r.article,
        score: r.score * contentWeight,
        reasons: [r.reason],
      });
    }
  }

  // Add popularity boost
  for (const [id, entry] of combined) {
    const article = allArticles.find((a) => a.id === id);
    if (article) {
      const popularityScore =
        (article.likeCount / Math.max(...allArticles.map((a) => a.likeCount))) *
        popularityWeight;
      entry.score += popularityScore;
    }
  }

  // Interest boost
  if (userProfile) {
    for (const entry of combined.values()) {
      if (userProfile.interests.includes(entry.article.category)) {
        entry.score *= 1.2;
      }
    }
  }

  return [...combined.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((e) => ({
      article: e.article,
      score: Math.min(e.score, 1),
      reason: e.reasons[0] ?? "Recommended for you",
    }));
}

// --- Trending Articles ---

export function getTrendingArticles(
  allArticles: Article[],
  topN = 6,
): Article[] {
  const now = Date.now();
  return [...allArticles]
    .sort((a, b) => {
      const recencyA =
        1 / (1 + (now - new Date(a.publishedAt).getTime()) / 86400000);
      const recencyB =
        1 / (1 + (now - new Date(b.publishedAt).getTime()) / 86400000);
      const scoreA = a.likeCount * 0.7 + recencyA * 1000 * 0.3;
      const scoreB = b.likeCount * 0.7 + recencyB * 1000 * 0.3;
      return scoreB - scoreA;
    })
    .slice(0, topN);
}

// --- Region-Based Filtering ---

export function getRegionRelevanceScore(
  article: Article,
  region: string,
): number {
  const regionKeywords: Record<string, string[]> = {
    "North America": [
      "US",
      "USA",
      "American",
      "Washington",
      "Canada",
      "Tesla",
      "Apple",
      "Netflix",
      "NBA",
      "NFL",
    ],
    Europe: [
      "EU",
      "European",
      "Britain",
      "UK",
      "France",
      "Germany",
      "Cannes",
      "Paris",
      "Berlin",
    ],
    Asia: [
      "China",
      "Japan",
      "India",
      "Korea",
      "Korean",
      "Beijing",
      "Tokyo",
      "USTC",
    ],
    "South America": ["Brazil", "Latin", "Argentina", "Santos"],
    Africa: ["Africa", "African", "Ghana", "Nigeria", "Kenya"],
  };

  const keywords = regionKeywords[region] ?? [];
  const text = `${article.title} ${article.content}`;
  const matches = keywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase()),
  ).length;

  return matches / Math.max(keywords.length, 1);
}
