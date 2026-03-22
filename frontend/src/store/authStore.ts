import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  orgId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setOrgId: (orgId: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      orgId: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setOrgId: (orgId) => {
        Cookies.set("org_id", orgId, { expires: 30, sameSite: "strict" });
        set({ orgId });
      },
      setTokens: (accessToken, refreshToken) => {
        Cookies.set("access_token", accessToken, { expires: 1, sameSite: "strict" });
        Cookies.set("refresh_token", refreshToken, { expires: 30, sameSite: "strict" });
      },
      logout: () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        Cookies.remove("org_id");
        set({ user: null, orgId: null, isAuthenticated: false });
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "nexu-auth",
      partialize: (state) => ({
        user: state.user,
        orgId: state.orgId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
