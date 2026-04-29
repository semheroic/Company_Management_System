import axios from "axios";
import { API_BASE } from "./companyApi";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role_id?: number | null;
  role?: string | null;
  department_id?: number | null;
  department?: string | null;
  permissions: string[];
  last_login?: string | null;
  created_at?: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface LoginInput {
  email: string;
  password: string;
}

interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role_id?: number | null;
  department_id?: number | null;
}

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

class AuthService {
  static async login(input: LoginInput): Promise<AuthUser> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/api/auth/login`, input, {
      headers: { "Content-Type": "application/json" },
    });

    this.persistSession(response.data);
    return response.data.user;
  }

  static async signUp(input: SignUpInput): Promise<AuthUser> {
    const response = await axios.post<AuthResponse>(`${API_BASE}/api/auth/signup`, input, {
      headers: { "Content-Type": "application/json" },
    });

    this.persistSession(response.data);
    return response.data.user;
  }

  static async getProfile(): Promise<AuthUser> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No auth token found.");
    }

    const response = await axios.get<AuthUser>(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    return response.data;
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getUser(): AuthUser | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as AuthUser;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private static persistSession(payload: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }
}

export default AuthService;
