export type AuthMode = "login" | "register";

export interface User {
    id: string;
    email: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    username: string;
    password: string;
}