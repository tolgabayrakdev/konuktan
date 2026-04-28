import env from "@/config/env"
import { toast } from "sonner"

export class ApiClientError extends Error {
  status: number
  data: { message?: string }

  constructor(
    status: number,
    data: { message?: string },
    message?: string
  ) {
    super(message ?? data.message ?? "Request failed")
    this.status = status
    this.data = data
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${env.API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    if (res.status === 401 && path !== "/api/auth/refresh") {
      window.dispatchEvent(new CustomEvent("auth:session-expired"))
    }
    if (res.status === 429) {
      toast.error("Çok fazla istek gönderildi. Lütfen bir süre bekleyin.")
    }
    throw new ApiClientError(res.status, data)
  }

  return data
}

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "DELETE" }),
}
