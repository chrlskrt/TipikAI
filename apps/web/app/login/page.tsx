
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { login } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await login({ email, password });
            localStorage.setItem("access_token", res.data.access_token);
            router.push("/");
        } catch (err: any) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/10 p-4">
            <Card className="w-full max-w-sm p-6 space-y-6 shadow-lg border">
                <div className="space-y-2 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 relative">
                        <img src="/TipikAI.png" alt="TipikAI Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">Enter your credentials to access your workspace</p>
                </div>
                {error && <div className="text-red-500 text-sm font-medium text-center bg-red-500/10 p-3 rounded border border-red-500/20">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                             <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                        </div>
                        <div className="relative">
                            <Input 
                                id="password" 
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-10" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>
                <div className="text-center text-sm text-muted-foreground">
                    Don't have an account? <Link href="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
                </div>
            </Card>
        </div>
    );
}
