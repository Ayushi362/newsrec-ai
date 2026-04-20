import Types "../types/articles-users-interactions";
import List   "mo:core/List";
import Map    "mo:core/Map";
import Float  "mo:core/Float";
import Text   "mo:core/Text";
import Nat    "mo:core/Nat";

/// Domain-logic module for the articles / users / interactions domain.
/// All functions receive state via parameters (stateless module).
module {
  public type Article               = Types.Article;
  public type UserInteraction       = Types.UserInteraction;
  public type User                  = Types.User;
  public type RecommendationResult  = Types.RecommendationResult;
  public type SystemMetrics         = Types.SystemMetrics;
  public type AlgorithmSource       = Types.AlgorithmSource;
  public type ArticleId             = Types.ArticleId;
  public type UserId                = Types.UserId;

  // ── Stopwords ─────────────────────────────────────────────────────────────

  let stopwords : [Text] = [
    "a","an","the","and","or","but","in","on","at","to","for","of","with",
    "by","from","is","are","was","were","be","been","being","have","has","had",
    "do","does","did","will","would","could","should","may","might","shall",
    "it","its","this","that","these","those","i","we","you","he","she","they",
    "my","our","your","his","her","their","me","us","him","them",
    "not","no","nor","so","yet","both","either","neither","as","if","while",
    "although","though","because","since","when","where","which","who","whom",
    "what","how","all","each","every","more","most","other","such","than","then",
    "too","very","just","also","only","new","one","two","three","can","into",
  ];

  func isStopword(word : Text) : Bool {
    stopwords.find(func(s : Text) : Bool { s == word }) != null
  };

  // ── TF-IDF computation ────────────────────────────────────────────────────

  /// Tokenize text: lowercase, split on non-alpha, remove stopwords, keep words >= 3 chars.
  func tokenize(text : Text) : [Text] {
    let lower = text.toLower();
    // Split on spaces and common punctuation by iterating chars
    let words : List.List<Text> = List.empty();
    var current : List.List<Char> = List.empty();

    for (c in lower.toIter()) {
      if ((c >= 'a' and c <= 'z')) {
        current.add(c);
      } else {
        if (current.size() >= 3) {
          let word = Text.fromIter(current.values());
          if (not isStopword(word)) {
            words.add(word);
          };
        };
        current := List.empty();
      };
    };
    // flush last word
    if (current.size() >= 3) {
      let word = Text.fromIter(current.values());
      if (not isStopword(word)) {
        words.add(word);
      };
    };
    words.toArray()
  };

  /// Compute TF-IDF vector for a single article given all articles' token lists.
  /// Returns sparse (term, weight) pairs.
  public func computeTfIdf(
    articleTokens : [Text],
    allTokenLists : [[Text]]
  ) : [(Text, Float)] {
    let totalDocs = allTokenLists.size();
    let docLen = articleTokens.size();
    if (docLen == 0) return [];

    // Count term frequencies in this document
    let tfMap = Map.empty<Text, Nat>();
    for (token in articleTokens.values()) {
      switch (tfMap.get(token)) {
        case (?count) tfMap.add(token, count + 1);
        case null     tfMap.add(token, 1);
      };
    };

    // Compute TF-IDF for each unique term
    let result = List.empty<(Text, Float)>();
    for ((term, count) in tfMap.entries()) {
      let tf : Float = count.toFloat() / docLen.toFloat();
      // Count docs containing the term
      var docsWithTerm = 0;
      for (tokens in allTokenLists.values()) {
        if (tokens.find(func(t : Text) : Bool { t == term }) != null) {
          docsWithTerm += 1;
        };
      };
      let idf : Float = Float.log(totalDocs.toFloat() / (docsWithTerm + 1).toFloat() + 1.0);
      let tfidf = tf * idf;
      if (tfidf > 0.0) {
        result.add((term, tfidf));
      };
    };
    result.toArray()
  };

  /// Tokenize all articles and compute TF-IDF vectors. Mutates articles in-place.
  public func computeAllTfIdf(articles : List.List<Article>) : () {
    let allArticles = articles.toArray();
    let allTokenLists = allArticles.map(func(a : Article) : [Text] { tokenize(a.title # " " # a.content) });
    articles.mapInPlace(func(article : Article) : Article {
      let idx = switch (allArticles.findIndex(func(a : Article) : Bool { a.id == article.id })) {
        case (?i) i;
        case null 0;
      };
      let tokens = allTokenLists[idx];
      let tfIdf = computeTfIdf(tokens, allTokenLists);
      { article with termFrequencies = tfIdf }
    });
  };

  // ── Article helpers ───────────────────────────────────────────────────────

  /// Return all articles as an immutable array.
  public func listArticles(
    articles : List.List<Article>
  ) : [Article] {
    articles.toArray()
  };

  /// Return a single article by id, or null if not found.
  public func getArticle(
    articles  : List.List<Article>,
    articleId : ArticleId
  ) : ?Article {
    articles.find(func(a : Article) : Bool { a.id == articleId })
  };

  // ── Interaction helpers ───────────────────────────────────────────────────

  /// Append a new interaction to the interaction list and update the user map.
  public func recordInteraction(
    interactions : List.List<UserInteraction>,
    users        : Map.Map<UserId, User>,
    userId       : UserId,
    articleId    : ArticleId,
    itype        : Types.InteractionType,
    timestamp    : Types.Timestamp
  ) : () {
    interactions.add({
      userId;
      articleId;
      interactionType = itype;
      timestamp;
    });
    // Update user's interacted article IDs
    let existing = users.get(userId);
    switch (existing) {
      case (?user) {
        // Add articleId if not already present
        let alreadySeen = user.interactedArticleIds.find(func(id : ArticleId) : Bool { id == articleId });
        if (alreadySeen == null) {
          let newIds = user.interactedArticleIds.concat([articleId]);
          users.add(userId, { user with interactedArticleIds = newIds });
        };
      };
      case null {
        users.add(userId, { id = userId; interactedArticleIds = [articleId] });
      };
    };
  };

  // ── Content-based filtering ───────────────────────────────────────────────

  /// Compute cosine similarity between two sparse TF-IDF vectors.
  public func cosineSimilarity(
    vecA : [(Text, Float)],
    vecB : [(Text, Float)]
  ) : Float {
    if (vecA.size() == 0 or vecB.size() == 0) return 0.0;

    // Build map from vecB for fast lookup
    let mapB = Map.empty<Text, Float>();
    for ((term, weight) in vecB.values()) {
      mapB.add(term, weight);
    };

    // Dot product
    var dot = 0.0;
    for ((term, weightA) in vecA.values()) {
      switch (mapB.get(term)) {
        case (?weightB) dot += weightA * weightB;
        case null {};
      };
    };

    // L2 norms
    var normA = 0.0;
    for ((_, w) in vecA.values()) { normA += w * w };
    var normB = 0.0;
    for ((_, w) in vecB.values()) { normB += w * w };

    let denom = Float.sqrt(normA) * Float.sqrt(normB);
    if (denom == 0.0) 0.0 else dot / denom
  };

  /// Return top-N articles most similar to the given seed article.
  public func contentBasedRecommendations(
    articles  : List.List<Article>,
    seedId    : ArticleId,
    topN      : Nat
  ) : [RecommendationResult] {
    let seed = switch (getArticle(articles, seedId)) {
      case (?a) a;
      case null return [];
    };
    let allArticles = articles.toArray();
    // Compute similarity for each article (skip the seed itself)
    let scored = List.empty<RecommendationResult>();
    for (article in allArticles.values()) {
      if (article.id != seedId) {
        let score = cosineSimilarity(seed.termFrequencies, article.termFrequencies);
        scored.add({
          article;
          score;
          algorithmSource = #contentBased;
          confidence = score;
        });
      };
    };
    // Sort descending by score, take top N
    let sorted = scored.sort(func(a : RecommendationResult, b : RecommendationResult) : {#less;#equal;#greater} {
      if (b.score > a.score) #less
      else if (b.score < a.score) #greater
      else #equal
    });
    sorted.toArray().sliceToArray(0, Nat.min(topN, sorted.size()))
  };

  // ── Collaborative filtering ───────────────────────────────────────────────

  /// Compute user–user cosine similarity based on article interaction sets (binary vectors).
  public func userSimilarity(
    userA       : User,
    userB       : User,
    allArticles : List.List<Article>
  ) : Float {
    let totalArticles = allArticles.size();
    if (totalArticles == 0) return 0.0;

    let setA = Map.empty<ArticleId, Bool>();
    for (id in userA.interactedArticleIds.values()) { setA.add(id, true) };
    let setB = Map.empty<ArticleId, Bool>();
    for (id in userB.interactedArticleIds.values()) { setB.add(id, true) };

    var dot = 0;
    for (id in userA.interactedArticleIds.values()) {
      switch (setB.get(id)) {
        case (?_) dot += 1;
        case null {};
      };
    };

    let normA = userA.interactedArticleIds.size();
    let normB = userB.interactedArticleIds.size();
    if (normA == 0 or normB == 0) return 0.0;

    dot.toFloat() / (Float.sqrt(normA.toFloat()) * Float.sqrt(normB.toFloat()))
  };

  /// Return top-N article recommendations for a user via collaborative filtering.
  public func collaborativeRecommendations(
    users        : Map.Map<UserId, User>,
    articles     : List.List<Article>,
    targetUserId : UserId,
    topN         : Nat
  ) : [RecommendationResult] {
    let _allArticles = articles.toArray();

    // Cold-start fallback: no user or 0 interactions → return top-N by popularity
    let targetUserOpt = users.get(targetUserId);
    let targetUser = switch (targetUserOpt) {
      case (?u) u;
      case null {
        // Return most popular articles
        return popularArticles(articles, users, topN);
      };
    };
    if (targetUser.interactedArticleIds.size() == 0) {
      return popularArticles(articles, users, topN);
    };

    // Compute similarity to all other users
    let similarities = List.empty<(UserId, Float)>();
    for ((uid, user) in users.entries()) {
      if (uid != targetUserId) {
        let sim = userSimilarity(targetUser, user, articles);
        similarities.add((uid, sim));
      };
    };

    // Sort descending by similarity, take top 3
    similarities.sortInPlace(func(a : (UserId, Float), b : (UserId, Float)) : {#less;#equal;#greater} {
      if (b.1 > a.1) #less
      else if (b.1 < a.1) #greater
      else #equal
    });
    let top3 = similarities.toArray().sliceToArray(0, Nat.min(3, similarities.size()));

    // Build set of articles target user already seen
    let seenSet = Map.empty<ArticleId, Bool>();
    for (id in targetUser.interactedArticleIds.values()) { seenSet.add(id, true) };

    // Collect candidate articles from similar users weighted by similarity
    let candidateScores = Map.empty<ArticleId, Float>();
    for ((uid, sim) in top3.values()) {
      switch (users.get(uid)) {
        case (?simUser) {
          for (aid in simUser.interactedArticleIds.values()) {
            if (seenSet.get(aid) == null) {
              let prev = switch (candidateScores.get(aid)) {
                case (?s) s;
                case null 0.0;
              };
              candidateScores.add(aid, prev + sim);
            };
          };
        };
        case null {};
      };
    };

    // Build result list
    let results = List.empty<RecommendationResult>();
    for ((aid, score) in candidateScores.entries()) {
      switch (getArticle(articles, aid)) {
        case (?article) {
          let normalized = Float.min(score, 1.0);
          results.add({
            article;
            score = normalized;
            algorithmSource = #collaborative;
            confidence = normalized;
          });
        };
        case null {};
      };
    };

    results.sortInPlace(func(a : RecommendationResult, b : RecommendationResult) : {#less;#equal;#greater} {
      if (b.score > a.score) #less
      else if (b.score < a.score) #greater
      else #equal
    });
    results.toArray().sliceToArray(0, Nat.min(topN, results.size()))
  };

  /// Return top-N most popular articles by total interaction count (cold-start helper).
  func popularArticles(
    articles : List.List<Article>,
    users    : Map.Map<UserId, User>,
    topN     : Nat
  ) : [RecommendationResult] {
    let popMap = Map.empty<ArticleId, Nat>();
    for ((_, user) in users.entries()) {
      for (aid in user.interactedArticleIds.values()) {
        let prev = switch (popMap.get(aid)) {
          case (?c) c;
          case null 0;
        };
        popMap.add(aid, prev + 1);
      };
    };
    let allArticles = articles.toArray();
    let results = List.empty<RecommendationResult>();
    for (article in allArticles.values()) {
      let count = switch (popMap.get(article.id)) {
        case (?c) c;
        case null 0;
      };
      // Normalize score: divide by total users (max possible interactions per article)
      let totalUsers = users.size().toFloat();
      let score = if (totalUsers == 0.0) 0.0 else count.toFloat() / totalUsers;
      results.add({
        article;
        score;
        algorithmSource = #collaborative;
        confidence = score;
      });
    };
    results.sortInPlace(func(a : RecommendationResult, b : RecommendationResult) : {#less;#equal;#greater} {
      if (b.score > a.score) #less
      else if (b.score < a.score) #greater
      else #equal
    });
    results.toArray().sliceToArray(0, Nat.min(topN, results.size()))
  };

  // ── Hybrid recommender ────────────────────────────────────────────────────

  /// Merge content-based and collaborative results with weighted scoring.
  public func hybridRecommendations(
    users        : Map.Map<UserId, User>,
    articles     : List.List<Article>,
    targetUserId : UserId,
    seedArticleId: ?ArticleId,
    topN         : Nat
  ) : [RecommendationResult] {
    let userOpt = users.get(targetUserId);
    let interactionCount = switch (userOpt) {
      case (?u) u.interactedArticleIds.size();
      case null 0;
    };

    // If user has fewer than 2 interactions, fall back to content-based only
    if (interactionCount < 2) {
      let seed = switch (seedArticleId) {
        case (?id) id;
        case null {
          // Pick first article as seed if none provided
          switch (articles.first()) {
            case (?a) a.id;
            case null return [];
          };
        };
      };
      let cbResults = contentBasedRecommendations(articles, seed, topN);
      return cbResults.map<RecommendationResult, RecommendationResult>(func(r) {
        { r with algorithmSource = #hybrid }
      });
    };

    // Build content-based score map
    let cbScoreMap = Map.empty<ArticleId, Float>();
    let seed = switch (seedArticleId) {
      case (?id) id;
      case null {
        // Use the user's most recently interacted article as seed
        switch (userOpt) {
          case (?u) {
            if (u.interactedArticleIds.size() > 0) {
              u.interactedArticleIds[u.interactedArticleIds.size() - 1]
            } else {
              switch (articles.first()) {
                case (?a) a.id;
                case null return [];
              };
            };
          };
          case null {
            switch (articles.first()) {
              case (?a) a.id;
              case null return [];
            };
          };
        };
      };
    };
    let cbResults = contentBasedRecommendations(articles, seed, articles.size());
    for (r in cbResults.values()) {
      cbScoreMap.add(r.article.id, r.score);
    };

    // Build collaborative score map
    let collabScoreMap = Map.empty<ArticleId, Float>();
    let collabResults = collaborativeRecommendations(users, articles, targetUserId, articles.size());
    for (r in collabResults.values()) {
      collabScoreMap.add(r.article.id, r.score);
    };

    // Blend: 0.5 * cbScore + 0.5 * collabScore for all candidate articles
    let allArticles = articles.toArray();
    let results = List.empty<RecommendationResult>();
    // Only recommend articles the user hasn't seen
    let seenSet = Map.empty<ArticleId, Bool>();
    switch (userOpt) {
      case (?u) {
        for (id in u.interactedArticleIds.values()) { seenSet.add(id, true) };
      };
      case null {};
    };

    for (article in allArticles.values()) {
      if (article.id != seed and seenSet.get(article.id) == null) {
        let cbScore = switch (cbScoreMap.get(article.id)) {
          case (?s) s;
          case null 0.0;
        };
        let collabScore = switch (collabScoreMap.get(article.id)) {
          case (?s) s;
          case null 0.0;
        };
        let blended = 0.5 * cbScore + 0.5 * collabScore;
        if (blended > 0.0) {
          results.add({
            article;
            score = blended;
            algorithmSource = #hybrid;
            confidence = blended;
          });
        };
      };
    };

    results.sortInPlace(func(a : RecommendationResult, b : RecommendationResult) : {#less;#equal;#greater} {
      if (b.score > a.score) #less
      else if (b.score < a.score) #greater
      else #equal
    });
    results.toArray().sliceToArray(0, Nat.min(topN, results.size()))
  };

  // ── Metrics ───────────────────────────────────────────────────────────────

  /// Compute aggregate system metrics.
  public func computeMetrics(
    articles     : List.List<Article>,
    users        : Map.Map<UserId, User>,
    interactions : List.List<UserInteraction>
  ) : SystemMetrics {
    let totalArticles = articles.size();
    let totalUsers = users.size();
    let totalInteractions = interactions.size();

    // Average similarity: sample pairwise cosine similarity across all articles
    let allArticles = articles.toArray();
    var simSum = 0.0;
    var simCount = 0;
    let sampleSize = Nat.min(totalArticles, 10); // sample first 10 for performance
    for (i in Nat.range(0, sampleSize)) {
      for (j in Nat.range(i + 1, sampleSize)) {
        let sim = cosineSimilarity(allArticles[i].termFrequencies, allArticles[j].termFrequencies);
        simSum += sim;
        simCount += 1;
      };
    };
    let avgSimilarity = if (simCount == 0) 0.0 else simSum / simCount.toFloat();

    // Recommendation coverage: ratio of articles appearing in at least one recommendation
    // Sample: run content-based recs for each article and collect unique article IDs
    let recommendedSet = Map.empty<ArticleId, Bool>();
    for (article in allArticles.values()) {
      let recs = contentBasedRecommendations(articles, article.id, 5);
      for (r in recs.values()) {
        recommendedSet.add(r.article.id, true);
      };
    };
    let coverage = if (totalArticles == 0) 0.0
      else recommendedSet.size().toFloat() / totalArticles.toFloat();

    {
      totalArticles;
      totalUsers;
      totalInteractions;
      averageSimilarityScore = avgSimilarity;
      recommendationCoverage = coverage;
    }
  };

  // ── Seeding ───────────────────────────────────────────────────────────────

  /// Populate articles, users, and interactions with demo seed data.
  public func seedData(
    articles     : List.List<Article>,
    users        : Map.Map<UserId, User>,
    interactions : List.List<UserInteraction>
  ) : () {
    // ── 20 articles across 5 categories ───────────────────────────────────
    let rawArticles : [(ArticleId, Text, Text, Text)] = [
      // Technology (4)
      (1, "Artificial Intelligence Transforms Healthcare Diagnostics",
       "Artificial intelligence and machine learning algorithms are revolutionizing healthcare diagnostics by analyzing medical images with unprecedented accuracy. Deep learning models trained on millions of patient records can detect cancers, identify rare diseases, and predict patient outcomes far earlier than traditional methods. Hospitals worldwide are adopting AI diagnostic tools that assist radiologists and pathologists, reducing human error and improving turnaround times. The technology processes MRI scans, CT images, and pathology slides in seconds, flagging anomalies for specialist review. Clinical trials have demonstrated that AI-assisted diagnoses match or exceed the accuracy of experienced physicians in many domains. Despite promising results, challenges remain around regulatory approval, data privacy, and integration with existing hospital information systems. Researchers are also exploring federated learning approaches that allow AI models to train across multiple institutions without sharing sensitive patient data, preserving privacy while improving generalization.",
       "Technology"),

      (2, "Quantum Computing Breakthrough Achieved by Research Team",
       "A team of physicists and computer scientists has achieved a major quantum computing milestone by demonstrating quantum advantage on a practical computational problem. The quantum processor, operating at temperatures near absolute zero, successfully factored large integers exponentially faster than the most powerful classical supercomputers. This breakthrough has significant implications for cryptography, drug discovery, and optimization problems in logistics and finance. The machine uses superconducting qubits that maintain coherence for record durations, enabling complex quantum circuits to execute reliably. Researchers employed novel error correction techniques that dramatically reduce decoherence, one of the primary obstacles to scalable quantum computation. Industry experts predict commercially viable quantum computers could arrive within five to ten years, potentially disrupting industries relying on current encryption standards. Governments and corporations are already investing billions into quantum research to secure strategic advantages in computing power.",
       "Technology"),

      (3, "Electric Vehicle Battery Technology Advances with Solid-State Innovation",
       "Solid-state battery technology promises to transform the electric vehicle industry by delivering higher energy density, faster charging speeds, and improved safety compared to conventional lithium-ion batteries. Leading automakers and battery manufacturers are racing to commercialize solid-state cells that replace liquid electrolytes with solid materials, eliminating the risk of thermal runaway and battery fires. Laboratory prototypes have achieved energy densities exceeding 400 watt-hours per kilogram, nearly double current commercial cells. Charging times could be reduced to under ten minutes for a full charge, dramatically improving convenience for drivers. The technology also extends battery lifespan, with cells demonstrating minimal degradation after thousands of charge cycles. Supply chain challenges remain, particularly in sourcing sufficient quantities of solid electrolyte materials like sulfide and oxide compounds. Mass production is expected to begin within three to five years as manufacturers scale pilot production lines.",
       "Technology"),

      (4, "Cybersecurity Threats Evolve as Ransomware Targets Critical Infrastructure",
       "Ransomware attacks targeting critical infrastructure have escalated dramatically, with threat actors deploying sophisticated malware against hospitals, power grids, water treatment facilities, and financial institutions. Nation-state sponsored hacking groups and criminal organizations are exploiting vulnerabilities in industrial control systems and operational technology networks that were designed before cybersecurity was a priority. Recent attacks have disrupted hospital operations, forcing staff to revert to paper records and delaying patient care. Security researchers warn that legacy systems running outdated software present significant vulnerabilities that cannot be quickly patched without disrupting essential services. Organizations are investing heavily in zero-trust security architectures, multi-factor authentication, network segmentation, and employee security awareness training. Government agencies are developing new regulations requiring critical infrastructure operators to meet minimum cybersecurity standards. International cooperation between law enforcement agencies has led to several high-profile arrests of ransomware operators, but the overall threat continues to grow.",
       "Technology"),

      // Business (4)
      (5, "Global Supply Chain Disruptions Force Companies to Rethink Sourcing Strategies",
       "Years of supply chain disruptions caused by pandemics, geopolitical tensions, and extreme weather events have forced multinational corporations to fundamentally restructure their sourcing and manufacturing strategies. The just-in-time manufacturing model that dominated global industry for decades is giving way to just-in-case approaches that prioritize resilience over pure efficiency. Companies are diversifying supplier bases, building strategic inventory reserves, and reshoring or nearshoring manufacturing operations closer to end markets. Technology investments in supply chain visibility platforms using artificial intelligence and blockchain are helping companies track materials and finished goods in real time. The automotive industry, severely impacted by semiconductor shortages, is signing long-term supply agreements directly with chip manufacturers to ensure stable component access. Retailers are adopting sophisticated demand forecasting algorithms to optimize inventory levels and reduce the risk of stockouts. Despite higher short-term costs, executives argue that resilient supply chains provide competitive advantages in volatile environments.",
       "Business"),

      (6, "Central Banks Navigate Inflation and Growth Tradeoffs in Monetary Policy",
       "Central banks around the world are grappling with the difficult challenge of controlling persistent inflation while avoiding recession as the effects of aggressive interest rate hikes work through economies. The Federal Reserve, European Central Bank, and Bank of England have raised rates to multi-decade highs, making borrowing significantly more expensive for businesses and households. Housing markets in many countries have cooled sharply as mortgage rates climbed, reducing construction activity and consumer spending on home-related goods. Small and medium-sized businesses report tightening credit conditions as banks raise lending standards amid concerns about loan defaults. Labor markets have remained surprisingly resilient, complicating central bank decisions about when to pivot toward rate cuts. Economists debate whether central banks can achieve soft landings, reducing inflation to target levels without triggering significant unemployment. Emerging market economies face additional pressures from strong dollar exchange rates increasing the cost of dollar-denominated debt servicing.",
       "Business"),

      (7, "Startup Ecosystem Faces Funding Crunch as Venture Capital Tightens",
       "The startup ecosystem is experiencing a significant funding correction after years of abundant venture capital fueled by near-zero interest rates and pandemic-driven technology adoption. Valuations across all stages from seed to late-stage growth have reset substantially, with many startups accepting down rounds or struggling to raise capital at all. Investors are demanding clearer paths to profitability rather than growth-at-all-costs strategies that characterized the previous cycle. Layoffs across technology startups have affected hundreds of thousands of workers globally as companies cut burn rates to extend runways. Founders are discovering that frugality and capital efficiency are rewarded in the current environment. Despite the correction, high-quality companies with strong unit economics and defensible market positions continue to attract investment. Artificial intelligence startups focused on enterprise software, healthcare, and infrastructure are receiving outsized attention from venture firms placing strategic bets on transformative technology. The market is expected to gradually recover as interest rates stabilize and investor confidence returns.",
       "Business"),

      (8, "ESG Investing Faces Scrutiny as Greenwashing Concerns Mount",
       "Environmental, social, and governance investing is facing intense scrutiny from both critics who argue it prioritizes ideology over returns and advocates who claim many funds engage in greenwashing by labeling conventional investments as sustainable. Regulatory bodies in Europe and the United States are implementing stricter disclosure requirements to prevent misleading claims about the environmental or social impact of investment products. Asset managers are conducting comprehensive reviews of their ESG methodologies and removing misleading labels from funds that do not meet newly established standards. Academic research presents mixed evidence about whether ESG strategies deliver superior long-term returns, with results varying significantly depending on methodology and time period studied. Institutional investors including pension funds are navigating political pressure from different directions, with some jurisdictions restricting ESG considerations in fiduciary decision-making. Despite controversy, corporate boards continue responding to investor pressure on climate risk disclosure, supply chain labor standards, and executive compensation transparency. The long-term trajectory of sustainable investing will depend significantly on regulatory frameworks and investor demand evolution.",
       "Business"),

      // Health (4)
      (9, "Mental Health Crisis Among Young People Prompts Policy Response",
       "Governments and healthcare systems worldwide are responding to a severe mental health crisis among young people with new funding, expanded services, and preventive programs. Rates of anxiety, depression, and self-harm among adolescents and young adults have increased significantly over the past decade, with the pandemic accelerating trends that researchers had already been observing. Social media use has been linked to deteriorating mental health outcomes in multiple studies, though the causal mechanisms remain debated among researchers. Schools are integrating mental health education into curricula and training teachers to identify students in distress. Teletherapy platforms have dramatically expanded access to mental health services, particularly in underserved rural and low-income communities where in-person providers are scarce. Early intervention programs targeting at-risk youth have demonstrated promising results in preventing escalation to more severe disorders. Researchers are investigating the role of sleep disruption, physical activity, and nutrition in adolescent mental health, seeking modifiable lifestyle factors that can be addressed through public health campaigns.",
       "Health"),

      (10, "Gene Therapy Advances Offer Hope for Rare Genetic Disorders",
       "Gene therapy has reached clinical milestone with multiple treatments receiving regulatory approval for rare genetic disorders that previously had no effective treatments. The technology delivers corrective genetic instructions directly into patients' cells, potentially providing lifelong benefits from a single treatment. Treatments for conditions including spinal muscular atrophy, hemophilia, and certain inherited blindness disorders have shown remarkable efficacy in clinical trials, restoring function in patients who had limited treatment options. Researchers are advancing next-generation approaches using base editing and prime editing technologies that can make precise single-letter corrections to the genetic code with minimal off-target effects. The primary challenge remains the extraordinary cost of gene therapies, with some treatments priced above one million dollars per patient, raising serious questions about healthcare system affordability and equitable access. Payers and pharmaceutical companies are experimenting with outcomes-based payment models where reimbursement is tied to demonstrated long-term effectiveness. Manufacturing scale-up remains challenging for viral vector production, limiting treatment availability despite growing demand.",
       "Health"),

      (11, "Microbiome Research Reveals Gut Health Links to Chronic Disease",
       "Emerging research on the human microbiome is revealing profound connections between gut bacterial communities and a wide range of chronic diseases including obesity, diabetes, cardiovascular disease, and neurological conditions. The gut microbiome, comprising trillions of microorganisms, plays critical roles in immune system regulation, nutrient metabolism, and even mood and cognitive function through the gut-brain axis. Studies have found distinct microbiome compositions associated with inflammatory bowel disease, colorectal cancer, and autoimmune conditions, suggesting diagnostic and therapeutic potential. Dietary interventions including increased fiber intake, fermented foods, and prebiotic supplementation can shift microbiome composition in measurable ways, though optimal compositions for specific health outcomes remain an active research area. Fecal microbiota transplantation has proven highly effective for recurrent Clostridioides difficile infections and is being investigated for conditions including metabolic syndrome and inflammatory bowel disease. Personalized nutrition approaches guided by microbiome analysis are being developed to optimize dietary recommendations for individual health outcomes. The field is advancing rapidly but translation from research findings to clinical practice requires further large-scale randomized controlled trials.",
       "Health"),

      (12, "Childhood Obesity Prevention Strategies Show Promising Community Results",
       "Community-based childhood obesity prevention programs implementing comprehensive lifestyle interventions are demonstrating meaningful improvements in weight outcomes and health behaviors among participating children and families. Programs combining school-based nutrition education, physical activity promotion, family counseling, and community environment modifications show the greatest effectiveness compared to single-component approaches. Policy interventions including sugar-sweetened beverage taxes, school meal standard improvements, and restrictions on food advertising targeting children have produced measurable reductions in consumption of unhealthy products. Research consistently shows that socioeconomic factors including food insecurity, neighborhood safety, and access to healthy affordable foods are major determinants of childhood obesity rates. Addressing these upstream social determinants requires collaboration between health systems, schools, community organizations, government agencies, and food industry partners. Technology-based interventions including smartphone applications and wearable activity trackers are being adapted for children and adolescents to support behavior change. Long-term follow-up studies examining whether childhood interventions translate into improved adult health outcomes are critical for justifying continued investment in prevention programs.",
       "Health"),

      // Science (4)
      (13, "James Webb Space Telescope Reveals Early Universe Galaxies",
       "The James Webb Space Telescope continues to astonish astronomers with unprecedented observations of the early universe, capturing light from galaxies that formed just a few hundred million years after the Big Bang. These ancient galaxies appear more massive and more structured than theoretical models predicted, challenging established understanding of how the universe evolved from a hot dense plasma to the complex cosmic web of galaxies and galaxy clusters observed today. Webb's infrared instruments peer through cosmic dust clouds that blocked visible-light telescopes, revealing star formation regions and the detailed chemical compositions of distant planetary atmospheres. Observations of exoplanet atmospheres have detected water vapor, carbon dioxide, and other molecules, advancing the search for potentially habitable worlds. The telescope is mapping the distribution of dark matter through gravitational lensing observations, helping scientists understand the large-scale structure of the universe. Collaborative international research teams are publishing hundreds of scientific papers based on Webb data, spanning topics from the first stars to the chemical evolution of galaxies. The telescope is expected to operate for at least twenty years, promising continued transformative discoveries.",
       "Science"),

      (14, "CRISPR Gene Editing Technology Expands Applications Beyond Medicine",
       "CRISPR-Cas9 gene editing technology is rapidly expanding beyond medical applications into agriculture, biofuels, industrial biotechnology, and environmental conservation. Agricultural researchers are developing disease-resistant crops that require fewer pesticides, drought-tolerant varieties for changing climate conditions, and nutritionally enhanced foods with improved vitamin or protein content. Conservation biologists are exploring gene drive technologies that could potentially eliminate invasive species threatening native ecosystems, though ethical and ecological concerns require careful consideration before deployment. Industrial biotechnology companies are engineering microorganisms to efficiently produce biofuels, biodegradable plastics, and industrial enzymes at commercial scale. The development of base editors and prime editors that make precise genetic changes without creating double-strand DNA breaks has expanded the toolkit for researchers. Regulatory frameworks for CRISPR-modified organisms vary significantly across jurisdictions, creating challenges for companies developing products intended for global markets. Public acceptance remains an important consideration particularly for food applications, requiring transparent communication about safety evidence and regulatory oversight processes.",
       "Science"),

      (15, "Climate Scientists Document Accelerating Polar Ice Loss",
       "Climate scientists using satellite measurements and field observations have documented accelerating rates of ice loss from glaciers and ice sheets in both polar regions, with significant implications for sea level rise projections and ocean circulation patterns. The Greenland ice sheet is losing mass at rates exceeding predictions from most climate models, with melt events of unprecedented extent occurring more frequently. Antarctic ice dynamics are proving more complex than previously understood, with some glaciers experiencing accelerated flow due to warming ocean water undercutting ice shelves. Updated sea level rise projections through 2100 now range from approximately half a meter under low emissions scenarios to over two meters under high emissions pathways, with potential for additional contributions from ice sheet instabilities. Coastal communities worldwide are beginning long-term adaptation planning including seawall construction, managed retreat from vulnerable areas, and protection of critical infrastructure. Geoengineering approaches including marine cloud brightening and stratospheric aerosol injection are receiving increased research attention as potential emergency measures if emissions reductions prove insufficient. International scientific collaboration through programs like the World Climate Research Programme continues to improve understanding of ice-climate interactions.",
       "Science"),

      (16, "New Particle Physics Experiments Probe Standard Model Boundaries",
       "Physicists operating particle accelerators at research centers around the world are conducting precision experiments designed to test the limits of the Standard Model of particle physics and search for evidence of new particles or forces beyond current theoretical frameworks. Recent measurements of the magnetic moment of the muon at Fermilab have shown deviations from Standard Model predictions that could indicate the existence of previously unknown particles or forces. The Large Hadron Collider at CERN has been upgraded to operate at higher energies and luminosity, enabling searches for supersymmetric particles, dark matter candidates, and other exotic phenomena. Neutrino experiments are measuring the properties of these ghostly particles with increasing precision, testing whether neutrinos and antineutrinos behave differently in ways that could explain the matter-antimatter asymmetry of the observable universe. Gravitational wave detectors are being upgraded to detect a broader range of cosmic events, potentially observing signatures of new physics from the early universe. The intersection of particle physics and cosmology is providing complementary approaches to fundamental questions about dark matter, dark energy, and the origins of cosmic structure.",
       "Science"),

      // World News (4)
      (17, "International Climate Summit Produces New Emissions Reduction Commitments",
       "World leaders gathering at the latest international climate summit have agreed to new commitments aimed at limiting global temperature rise, though environmental groups argue the pledges fall short of what scientists say is necessary to avoid the worst climate impacts. Developed nations have pledged increased climate finance to help vulnerable developing countries adapt to climate impacts and transition to clean energy systems. Negotiations over carbon markets have produced new frameworks intended to ensure that emissions reductions credits represent genuine atmospheric benefits rather than accounting maneuvers. The summit has produced agreements to accelerate the phase-out of coal-fired power plants and end public financing for new fossil fuel infrastructure overseas. Several major economies announced enhanced nationally determined contributions committing to steeper greenhouse gas reductions by 2030 and net-zero emissions by mid-century. Critics point to the gap between stated commitments and current policy trajectories in most countries. Progress on loss and damage funding for countries already experiencing severe climate impacts has been a contentious negotiation topic requiring compromise from both developed and developing country delegations.",
       "World News"),

      (18, "Global Food Security Threatened by Multiple Converging Crises",
       "The United Nations World Food Programme is warning that global food security faces unprecedented threats from the simultaneous occurrence of conflicts, extreme weather events, economic shocks, and the continuing effects of previous pandemic disruptions. The number of people experiencing acute food insecurity has reached alarming levels not seen in generations, with tens of millions facing crisis-level hunger in conflict-affected regions of Africa, the Middle East, and Asia. Climate change is reducing agricultural productivity in many vulnerable regions through more frequent droughts, floods, and extreme heat events that damage crops. Disruptions to fertilizer supply chains have increased production costs for farmers worldwide, particularly in developing countries that rely heavily on imported agricultural inputs. International aid agencies are calling for increased funding and improved coordination among donors to prevent famine conditions in the most vulnerable countries. Agricultural researchers are intensifying work on drought-resistant crop varieties, precision agriculture technologies, and sustainable farming practices to improve resilience. Reducing food waste throughout supply chains from farm to consumer represents a significant untapped opportunity to improve food availability without expanding production.",
       "World News"),

      (19, "Demographic Shifts Transform Labor Markets in Developed Economies",
       "Rapidly aging populations in developed economies across Europe, North America, and East Asia are creating profound labor market transformations as the ratio of working-age people to retirees declines. Governments face growing fiscal pressures from pension systems and healthcare programs designed for earlier demographic profiles with higher birth rates and shorter life expectancies. Immigration policy has become increasingly central to economic planning, with many countries competing for skilled workers from abroad to address labor shortages in critical sectors. The healthcare sector faces particularly acute workforce shortages as demand for elder care services grows while the pool of working-age people available for these roles contracts. Automation and artificial intelligence are being deployed to partially offset labor shortages in manufacturing, logistics, and service sectors, with complex implications for employment patterns and wage distribution. Retirement age adjustments, incentives for older workers to remain employed longer, and policies supporting higher birth rates are among the interventions governments are considering. International migration patterns are becoming increasingly important determinants of relative economic performance among developed nations.",
       "World News"),

      (20, "Humanitarian Organizations Respond to Rising Global Displacement",
       "Humanitarian organizations are responding to record levels of global displacement caused by protracted conflicts, climate-related disasters, and economic crises, with the total number of forcibly displaced people worldwide reaching historic highs. Refugee camps and urban displacement settings across multiple continents are struggling with inadequate resources to meet the basic needs of displaced populations including food, water, shelter, healthcare, and education for children. Host countries in regions neighboring conflict zones bear disproportionate burdens relative to their economic capacity, while wealthier nations debate immigration and refugee policies. Climate displacement is emerging as a distinct and growing category, with communities in low-lying coastal areas, drought-affected agricultural regions, and areas experiencing extreme heat being forced to relocate. Legal frameworks for protecting climate-displaced people remain inadequate, as existing refugee conventions do not explicitly cover those fleeing environmental deterioration. International organizations are calling for increased funding, better burden-sharing mechanisms among nations, and reformed legal frameworks to address the humanitarian needs of displaced populations. Long-term solutions require addressing the root causes of displacement through conflict resolution, climate action, and sustainable development investment.",
       "World News"),
    ];

    // Add articles without TF-IDF first
    for ((id, title, content, category) in rawArticles.values()) {
      articles.add({
        id;
        title;
        content;
        category;
        termFrequencies = [];
      });
    };

    // Compute TF-IDF vectors for all articles
    computeAllTfIdf(articles);

    // ── 5 users ──────────────────────────────────────────────────────────────
    // user1 & user2: overlapping in Technology + Science
    // user3 & user4: overlapping in Health + World News
    // user5: mixed

    let userInteractions : [(UserId, [ArticleId])] = [
      ("user1", [1, 2, 3, 4, 13, 14, 15, 16]),   // Technology + Science
      ("user2", [1, 2, 13, 14, 3, 5, 15, 16]),    // Overlaps user1 heavily
      ("user3", [9, 10, 11, 12, 17, 18, 19, 20]), // Health + World News
      ("user4", [9, 10, 17, 18, 11, 6, 19, 20]),  // Overlaps user3 heavily
      ("user5", [1, 5, 9, 13, 17, 6, 10, 14]),    // Mixed across all categories
    ];

    for ((uid, articleIds) in userInteractions.values()) {
      users.add(uid, { id = uid; interactedArticleIds = articleIds });
      var ts : Int = 1700000000000000000; // base timestamp
      for (aid in articleIds.values()) {
        interactions.add({
          userId = uid;
          articleId = aid;
          interactionType = #click;
          timestamp = ts;
        });
        ts += 3600000000000; // +1 hour per interaction
      };
    };
  };
};
