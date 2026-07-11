import { API_CONFIG } from "@/config/api-config";

const BASE = API_CONFIG.BASE_URL;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  username: string;
  nickname: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nickname?: string;
}

export interface RegisterResponse {
  userId: number;
  username: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `请求失败 (${res.status})`);
  }
  const json = await res.json();
  if (json.code !== "0000") {
    throw new Error(json.info || "操作失败");
  }
  return json.data as T;
}

const fetchOpts: RequestInit = {
  credentials: "include",
};

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await fetch(`${BASE}/auth/login`, {
      ...fetchOpts,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<LoginResponse>(res);
  },

  logout: async (): Promise<void> => {
    const res = await fetch(`${BASE}/auth/logout`, {
      ...fetchOpts,
      method: "POST",
    });
    if (!res.ok) throw new Error("登出失败");
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await fetch(`${BASE}/auth/register`, {
      ...fetchOpts,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<RegisterResponse>(res);
  },
};
