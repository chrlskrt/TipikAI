
"use client";

import * as React from "react";
import { WizardHistory } from "@/components/model-wizard/wizard-history";
import { WizardContainer } from "@/components/model-wizard/wizard-container";
import { Moon, Sun, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [loadedChatId, setLoadedChatId] = React.useState<string | undefined>();
    const [loadedMessages, setLoadedMessages] = React.useState<any[]>([]);
    const [loadedChatTitle, setLoadedChatTitle] = React.useState<string | undefined>();
    const [loadedExecutionId, setLoadedExecutionId] = React.useState<string | undefined>();

    React.useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem("access_token");
        setIsLoggedIn(!!token);

        // Listen for storage changes (e.g., when token is removed due to 401 error)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "access_token") {
                setIsLoggedIn(!!e.newValue);
            }
        };

        // Listen for custom auth change events (for same-tab changes)
        const handleAuthChange = () => {
            const currentToken = localStorage.getItem("access_token");
            setIsLoggedIn(!!currentToken);
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("auth-change", handleAuthChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth-change", handleAuthChange);
        };
    }, []);

    // Toggle theme just for demo (in real app use next-themes)
    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    if (!mounted) return null;

    const handleNewWizard = () => {
        // Clear loaded state
        setLoadedChatId(undefined);
        setLoadedMessages([]);
        setLoadedChatTitle(undefined);
        setLoadedExecutionId(undefined);
        window.location.reload();
    };

    const handleSelectChat = async (chatId: string) => {
        try {
            console.log('Loading chat:', chatId);
            const { getMessages, getChat, getExecutionsByChatId } = await import('@/lib/api');
            
            // Load chat details, messages, and executions
            const [chat, messages, executions] = await Promise.all([
                getChat(chatId),
                getMessages(chatId),
                getExecutionsByChatId(chatId)
            ]);
            
            console.log('Chat loaded:', chat);
            console.log('Messages:', messages);
            console.log('Executions:', executions);
            
            // Set loaded state to reconstruct wizard
            setLoadedChatId(chatId);
            setLoadedMessages(messages);
            setLoadedChatTitle(chat.title || undefined);
            
            // Get the most recent execution if any
            if (executions && executions.length > 0) {
                setLoadedExecutionId(executions[0].id);
            } else {
                setLoadedExecutionId(undefined);
            }
            
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    };

    return (
        <main className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground relative">
            {/* Top-left auth button - only show if not logged in */}
            {!isLoggedIn && (
                <div className="absolute top-4 left-4 z-50">
                    <Button 
                        onClick={() => router.push('/login')}
                        variant="outline"
                        className="gap-2"
                    >
                        <LogIn className="h-4 w-4" />
                        Sign In / Register
                    </Button>
                </div>
            )}

            {/* Sidebar / Creation History - only show if logged in */}
            {isLoggedIn && (
                <aside 
                    className={`
                        border-r bg-muted/20 transition-all duration-300 ease-in-out
                        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
                        hidden md:block h-full
                    `}
                >
                    <div className="h-full w-64">
                         <WizardHistory 
                            onNewWizard={handleNewWizard}
                            onSelectChat={handleSelectChat}
                         />
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <section className="flex-1 flex flex-col h-full relative bg-background">
                 {/* Header */}
                <header className="h-14 px-4 flex items-center justify-between border-b bg-background sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs">
                                T
                            </div>
                            <h1 className="font-semibold text-sm tracking-tight">TipikAI</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="h-8 w-8"
                        >
                            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </Button>
                        {isLoggedIn && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => {
                                    localStorage.removeItem("access_token");
                                    window.location.href = "/login";
                                }}
                            >
                                Logout
                            </Button>
                        )}
                    </div>
                </header>

                {/* Wizard / Workspace */}
                <div className="flex-1 overflow-auto bg-muted/5 p-4">
                    <WizardContainer 
                        loadedChatId={loadedChatId}
                        loadedChatTitle={loadedChatTitle}
                        loadedExecutionId={loadedExecutionId}
                    />
                </div>
            </section>
        </main>
    );
}
