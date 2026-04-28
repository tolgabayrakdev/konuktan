import { create } from "zustand"
import { apiClient, ApiClientError } from "@/lib/api-client"
import env from "@/config/env"

export interface User {
  id: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  sessionExpired: boolean
  rateLimited: boolean
  setSessionExpired: (val: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  extendSession: () => Promise<void>
}

const HAD_SESSION_KEY = "ks_had_session"

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  sessionExpired: false,
  rateLimited: false,
  setSessionExpired: (val) => set({ sessionExpired: val }),
  login: async (email: string, password: string) => {
    const res = await apiClient.post<{ success: boolean; data: User }>("/api/auth/login", { email, password })
    localStorage.setItem(HAD_SESSION_KEY, "1")
    set({ user: res.data, isAuthenticated: true })
  },
  register: async (email: string, password: string) => {
    await apiClient.post("/api/auth/register", { email, password })
  },
  logout: async () => {
    try {
      await apiClient.post("/api/auth/logout")
    } finally {
      localStorage.removeItem(HAD_SESSION_KEY)
      set({ user: null, isAuthenticated: false, sessionExpired: false })
    }
  },
  extendSession: async () => {
    try {
      const res = await fetch(`${env.API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Refresh failed")
      const userRes = await apiClient.get<{ success: boolean; data: User }>("/api/account/me")
      localStorage.setItem(HAD_SESSION_KEY, "1")
      set({ user: userRes.data, isAuthenticated: true, sessionExpired: false })
    } catch {
      localStorage.removeItem(HAD_SESSION_KEY)
      set({ user: null, isAuthenticated: false, sessionExpired: false })
    }
  },
  checkAuth: async () => {
    set({ loading: true })
    try {
      const res = await apiClient.get<{ success: boolean; data: User }>("/api/account/me")
      localStorage.setItem(HAD_SESSION_KEY, "1")
      set({ user: res.data, isAuthenticated: true, loading: false, rateLimited: false })
      return true
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        const hadSession = !!localStorage.getItem(HAD_SESSION_KEY)
        set({ loading: false, sessionExpired: hadSession })
        return false
      }
      if (error instanceof ApiClientError && error.status === 429) {
        set({ loading: false, rateLimited: true })
        return false
      }
      set({ user: null, isAuthenticated: false, loading: false })
      return false
    }
  },
}))

export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useCurrentUser = () => useAuthStore((state) => state.user)
export const useAuthLoading = () => useAuthStore((state) => state.loading)
