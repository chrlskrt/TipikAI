export type AuthMode = "login" | "register";

export interface User {
    id: string;
    email: string;
    username: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
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

/**
 * Decode user info from JWT token stored in localStorage
 * Returns null if no token or invalid token
 */
export function getUserFromToken(): { id: string; email: string; name?: string } | null {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        // Decode the payload (base64url)
        const payload = parts[1];
        if (!payload) return null;
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        
        return {
            id: decoded.sub || decoded.id || decoded.userId,
            email: decoded.email,
            name: decoded.username || decoded.name,
        };
    } catch (error) {
        console.error('Failed to decode JWT token:', error);
        return null;
    }
}