import { apiClient } from "@/lib/api";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  profile_picture_url?: string | null;
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
  token?: string;
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
  profile_picture_url?: string | null;
  profile_picture?: File | null;
}

const USER_KEY = "authUser";
const TOKEN_KEY = "authToken";

class AuthService {
  static async login(input: LoginInput): Promise<AuthUser> {
    const response = await apiClient.post<AuthResponse>("/api/auth/login", input, {
      headers: { "Content-Type": "application/json" },
    });

    this.persistAuth(response.data.user, response.data.token);
    return response.data.user;
  }

  static async signUp(input: SignUpInput): Promise<AuthUser> {
    const hasFileUpload = input.profile_picture instanceof File;
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/signup",
      hasFileUpload ? this.buildProfilePayload(input) : this.buildJsonPayload(input),
      {
        headers: {
          "Content-Type": hasFileUpload ? "multipart/form-data" : "application/json",
        },
      },
    );

    this.persistAuth(response.data.user, response.data.token);
    return response.data.user;
  }

  static async getProfile(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>("/api/auth/me");
    this.persistAuth(response.data);
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

  static async updateProfile(
    input: Partial<Pick<AuthUser, "name" | "email" | "profile_picture_url">> & {
      password?: string;
      profile_picture?: File | null;
    },
  ): Promise<AuthUser> {
    const hasFileUpload = input.profile_picture instanceof File;
    const response = await apiClient.put<AuthUser>(
      "/api/auth/profile",
      hasFileUpload ? this.buildProfilePayload(input) : this.buildJsonPayload(input),
      {
        headers: {
          "Content-Type": hasFileUpload ? "multipart/form-data" : "application/json",
        },
      },
    );

    this.persistAuth(response.data);
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
    localStorage.removeItem(TOKEN_KEY);
  }

  private static persistAuth(user: AuthUser, token?: string) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  private static buildJsonPayload<
    T extends Partial<{
      name: string;
      email: string;
      password: string;
      role_id: number | null;
      department_id: number | null;
      profile_picture_url: string | null;
    }>,
  >(input: T) {
    return Object.fromEntries(
      Object.entries(input).filter(([key, value]) => key !== "profile_picture" && value !== undefined),
    );
  }

  private static buildProfilePayload<
    T extends Partial<{
      name: string;
      email: string;
      password: string;
      role_id: number | null;
      department_id: number | null;
      profile_picture_url: string | null;
      profile_picture: File | null;
    }>,
  >(input: T) {
    const formData = new FormData();

    if (input.name !== undefined) formData.append("name", input.name);
    if (input.email !== undefined) formData.append("email", input.email);
    if (input.password !== undefined) formData.append("password", input.password);
    if (input.role_id !== undefined && input.role_id !== null) {
      formData.append("role_id", String(input.role_id));
    }
    if (input.department_id !== undefined && input.department_id !== null) {
      formData.append("department_id", String(input.department_id));
    }
    if (input.profile_picture_url !== undefined && input.profile_picture_url !== null) {
      formData.append("profile_picture_url", input.profile_picture_url);
    }
    if (input.profile_picture instanceof File) {
      formData.append("profile_picture", input.profile_picture);
    }

    return formData;
  }
}

export default AuthService;
