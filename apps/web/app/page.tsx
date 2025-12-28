
"use client";

import * as React from "react";
import { ChatInterface } from "@/components/chat-interface";
import { WizardContainer } from "@/components/model-wizard/wizard-container";
import { Moon, Sun, Monitor, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    React.useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem("access_token");
        if (!token) {
            window.location.href = "/login";
        }
    }, []);

    // Toggle theme just for demo (in real app use next-themes)
    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    if (!mounted) return null;

    return (
        <main className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
            {/* Sidebar / Creation History */}
            <aside 
                className={`
                    border-r bg-muted/20 transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
                    hidden md:block h-full
                `}
            >
                <div className="h-full w-64">
                     <ChatInterface onNewCreation={() => window.location.reload()} />
                </div>
            </aside>

            {/* Main Content Area */}
            <section className="flex-1 flex flex-col h-full relative bg-background">
                 {/* Header */}
                <header className="h-14 px-4 flex items-center justify-between border-b bg-background sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex h-8 w-8">
                            <Menu className="h-4 w-4" />
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
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="h-8 w-8"
                        >
                            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </Button>
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
                    </div>
                </header>

                {/* Wizard / Workspace */}
                <div className="flex-1 overflow-auto bg-muted/5 p-4">
                    <WizardContainer />
                </div>
            </section>
        </main>
    );
}
