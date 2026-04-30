import { apiClient } from "@/lib/api";

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

const USER_KEY = "authUser";

class AuthService {
  static async login(input: LoginInput): Promise<AuthUser> {
    const response = await apiClient.post<AuthResponse>("/api/auth/login", input, {
      headers: { "Content-Type": "application/json" },
    });

    this.persistUser(response.data.user);
    return response.data.user;
  }

  static async signUp(input: SignUpInput): Promise<AuthUser> {
    const response = await apiClient.post<AuthResponse>("/api/auth/signup", input, {
      headers: { "Content-Type": "application/json" },
    });

    this.persistUser(response.data.user);
    return response.data.user;
  }

  static async getProfile(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/api/auth/me");
    this.persistUser(response.data);
    return response.data;
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
    return Boolean(this.getUser());
  }

  static async updateProfile(input: Partial<Pick<AuthUser, "name" | "email">> & { password?: string }): Promise<AuthUser> {
    const response = await apiClient.put<AuthUser>("/api/auth/profile", input, {
      headers: { "Content-Type": "application/json" },
    });

    this.persistUser(response.data);
    return response.data;
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      this.clearCachedUser();
    }
  }

  static clearCachedUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  private static persistUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export default AuthService;
