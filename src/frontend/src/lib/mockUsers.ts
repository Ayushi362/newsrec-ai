import type { UserProfile } from "@/types";

export const MOCK_USERS: UserProfile[] = [
  {
    id: "user1",
    name: "Alex Rivera",
    region: "North America",
    interests: ["Technology", "Science"],
    likedArticles: ["1", "4", "8"],
    readHistory: ["1", "2", "4", "8", "10", "14"],
    searchHistory: ["AI news", "quantum computing"],
  },
  {
    id: "user2",
    name: "Sophie Laurent",
    region: "Europe",
    interests: ["Politics", "Business"],
    likedArticles: ["2", "7", "13", "19"],
    readHistory: ["2", "7", "13", "19", "20", "3"],
    searchHistory: ["EU regulation", "climate policy", "economy"],
  },
  {
    id: "user3",
    name: "Kenji Watanabe",
    region: "Asia",
    interests: ["Entertainment", "Sports"],
    likedArticles: ["5", "6", "11", "17"],
    readHistory: ["5", "6", "11", "17", "18", "12"],
    searchHistory: ["Champions League", "Netflix shows", "Olympics"],
  },
  {
    id: "user4",
    name: "Isabella Santos",
    region: "South America",
    interests: ["Health", "Science"],
    likedArticles: ["3", "9", "15", "16"],
    readHistory: ["3", "9", "15", "16", "4", "10"],
    searchHistory: [
      "CRISPR therapy",
      "nuclear fusion",
      "Alzheimer's treatment",
    ],
  },
  {
    id: "user5",
    name: "Amara Osei",
    region: "Africa",
    interests: ["Business", "Technology"],
    likedArticles: ["14", "19", "2"],
    readHistory: ["14", "19", "2", "1", "7", "20"],
    searchHistory: ["Tesla self-driving", "India economy", "digital rights"],
  },
];
