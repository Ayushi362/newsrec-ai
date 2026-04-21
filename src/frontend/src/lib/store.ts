import type {
  Article,
  Interaction,
  InteractionType,
  UserProfile,
} from "@/types";
import { create } from "zustand";
import { MOCK_ARTICLES } from "./mockData";
import { MOCK_USERS } from "./mockUsers";

interface StoreState {
  articles: Article[];
  users: UserProfile[];
  currentUserId: string;
  interactions: Interaction[];
  searchHistory: string[];

  // Actions
  setCurrentUser: (userId: string) => void;
  recordInteraction: (
    userId: string,
    articleId: string,
    type: InteractionType,
  ) => void;
  toggleLike: (userId: string, articleId: string) => void;
  addArticle: (article: Article) => void;
  recordSearch: (query: string) => void;
  getCurrentUser: () => UserProfile | undefined;
}

export const useStore = create<StoreState>((set, get) => ({
  articles: MOCK_ARTICLES,
  users: MOCK_USERS,
  currentUserId: "user1",
  interactions: [],
  searchHistory: [],

  setCurrentUser: (userId: string) => {
    set({ currentUserId: userId });
  },

  recordInteraction: (
    userId: string,
    articleId: string,
    type: InteractionType,
  ) => {
    const interaction: Interaction = {
      userId,
      articleId,
      type,
      timestamp: Date.now(),
    };

    set((state) => ({
      interactions: [...state.interactions, interaction],
      users: state.users.map((u) => {
        if (u.id !== userId) return u;
        const readHistory =
          type === "read" || type === "click"
            ? u.readHistory.includes(articleId)
              ? u.readHistory
              : [...u.readHistory, articleId]
            : u.readHistory;
        return { ...u, readHistory };
      }),
    }));
  },

  toggleLike: (userId: string, articleId: string) => {
    set((state) => {
      const user = state.users.find((u) => u.id === userId);
      if (!user) return state;

      const isLiked = user.likedArticles.includes(articleId);
      const newLiked = isLiked
        ? user.likedArticles.filter((id) => id !== articleId)
        : [...user.likedArticles, articleId];

      const interaction: Interaction = {
        userId,
        articleId,
        type: "like",
        timestamp: Date.now(),
      };

      return {
        users: state.users.map((u) =>
          u.id === userId ? { ...u, likedArticles: newLiked } : u,
        ),
        articles: state.articles.map((a) =>
          a.id === articleId
            ? { ...a, likeCount: isLiked ? a.likeCount - 1 : a.likeCount + 1 }
            : a,
        ),
        interactions: isLiked
          ? state.interactions
          : [...state.interactions, interaction],
      };
    });
  },

  addArticle: (article: Article) => {
    set((state) => ({ articles: [article, ...state.articles] }));
  },

  recordSearch: (query: string) => {
    set((state) => {
      const currentUserId = state.currentUserId;
      return {
        searchHistory: [...new Set([query, ...state.searchHistory])].slice(
          0,
          20,
        ),
        users: state.users.map((u) =>
          u.id === currentUserId
            ? {
                ...u,
                searchHistory: [...new Set([query, ...u.searchHistory])].slice(
                  0,
                  20,
                ),
              }
            : u,
        ),
      };
    });
  },

  getCurrentUser: () => {
    const state = get();
    return state.users.find((u) => u.id === state.currentUserId);
  },
}));
