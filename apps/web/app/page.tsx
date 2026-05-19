
"use client";

import * as React from "react";
import { WizardHistory } from "@/components/model-wizard/wizard-history";
import { WizardContainer } from "@/components/model-wizard/wizard-container";
import { ModeSelection } from "@/components/model-wizard/mode-selection";
import { ChatInterface } from "@/components/model-wizard/chat-interface";
import { cn } from "@/lib/utils";
import { getUserFromToken } from "@/lib/types";
import { Moon, Sun, LogIn, Loader2, ArrowLeft, PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    const [isLoadingChat, setIsLoadingChat] = React.useState(false);
    const [selectedChatId, setSelectedChatId] = React.useState<string | undefined>();
    const [mode, setMode] = React.useState<'selection' | 'one-prompt' | 'step-by-step'>(
        'selection'
    );
    const [hasChatted, setHasChatted] = React.useState(false);
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);
    const [currentUser, setCurrentUser] = React.useState<{ id: string; email: string; name?: string } | null>(null);

    React.useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem("access_token");
        setIsLoggedIn(!!token);
        setCurrentUser(getUserFromToken());

        // Listen for storage changes (e.g., when token is removed due to 401 error)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "access_token") {
                setIsLoggedIn(!!e.newValue);
                setCurrentUser(getUserFromToken());
            }
        };

        // Listen for custom auth change events (for same-tab changes)
        const handleAuthChange = () => {
            const currentToken = localStorage.getItem("access_token");
            setIsLoggedIn(!!currentToken);
            setCurrentUser(getUserFromToken());
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
        setHasChatted(false);
        setMode('selection');
    };

    const handleModeSelect = async (selectedMode: 'one-prompt' | 'step-by-step') => {
        setMode(selectedMode);
    };

    const handleBackToSelection = () => {
        setMode('selection');
    };

    const handleSelectChat = async (chatId: string) => {
        setIsLoadingChat(true);
        setSelectedChatId(chatId);
        
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
            setHasChatted(messages.length > 0);
            
            // Get the most recent execution if any
            if (executions && executions.length > 0) {
                const mostRecentExecution = executions[0];
                if (mostRecentExecution) {
                    setLoadedExecutionId(mostRecentExecution.id);
                }
                // If it has executions, it was likely a one-prompt mode
                setMode('one-prompt');
            } else {
                setLoadedExecutionId(undefined);
                // If it has messages but no executions, it's a step-by-step chat
                if (messages.length > 0 || (chat.title && chat.title.toLowerCase().includes('assistant'))) {
                    setMode('step-by-step');
                } else {
                    setMode('one-prompt');
                }
            }
            
        } catch (error) {
            console.error('Failed to load chat:', error);
        } finally {
            setIsLoadingChat(false);
            setSelectedChatId(undefined);
        }
    };

    const handleMessageSaved = () => {
        setHasChatted(true);
        setRefreshTrigger(prev => prev + 1);
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

            {/* Sidebar / Creation History */}
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
                        selectedChatId={selectedChatId}
                        refreshTrigger={refreshTrigger}
                     />
                </div>
            </aside>

            {/* Main Content Area */}
            <section className="flex-1 flex flex-col h-full relative bg-background">
                 {/* Header */}
                <header className="h-14 px-4 flex items-center justify-between border-b bg-background sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="h-8 w-8 hidden md:flex"
                            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                        >
                            <PanelLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
                        </Button>
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
                            onClick={handleNewWizard}
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="New Wizard"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
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
                {mode === 'selection' ? (
                    <div className="flex-1 overflow-auto bg-muted/5">
                        <ModeSelection onSelectMode={handleModeSelect} />
                    </div>
                ) : mode === 'step-by-step' ? (
                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        <ChatInterface 
                            chatId={loadedChatId} 
                            onMessage={handleMessageSaved} 
                            onChatIdEstablished={(id) => {
                                if (!loadedChatId) {
                                    setLoadedChatId(id);
                                    setRefreshTrigger(prev => prev + 1);
                                }
                            }}
                            initialMessages={loadedMessages}
                            user={currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined}
                        />
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto bg-muted/5 p-4">
                        {/* One-prompt mode active viewport */}
                        <WizardContainer 
                            loadedChatId={loadedChatId}
                            loadedChatTitle={loadedChatTitle}
                            loadedExecutionId={loadedExecutionId}
                        />
                    </div>
                )}
            </section>

            {/* Loading Modal */}
            <Dialog open={isLoadingChat} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Loading Chat History
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Fetching your chat details and execution history...
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-6">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Please wait</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
