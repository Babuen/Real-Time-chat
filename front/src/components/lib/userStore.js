import { create } from "zustand";
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from "./api";

export const useUserStore = create((set) => ({
  currentUser: null,
  token: getAuthToken(),
  isLoading: true,
  setAuth: (token, user) => {
    setAuthToken(token);
    set({ token, currentUser: user, isLoading: false });
  },
  logout: () => {
    clearAuthToken();
    set({ token: null, currentUser: null, isLoading: false });
  },
  fetchUserInfo: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ token: null, currentUser: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await apiRequest("/auth/me", { token });
      set({ currentUser: response.user, token, isLoading: false });
    } catch (err) {
      console.error("Error fetching current user:", err);
      clearAuthToken();
      set({ token: null, currentUser: null, isLoading: false });
    }
  },
}));
