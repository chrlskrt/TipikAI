"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Wand2, Clock, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChats, deleteChat, Chat } from "@/lib/api";

interface WizardHistoryProps {
    className?: string;
    onNewWizard: () => void;
    onSelectChat?: (chatId: string) => void;
    selectedChatId?: string;
    refreshTrigger?: number;
}

export function WizardHistory({ className, onNewWizard, onSelectChat, selectedChatId, refreshTrigger = 0 }: WizardHistoryProps) {
    const [history, setHistory] = React.useState<Chat[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Load chat history
    React.useEffect(() => {
        loadHistory();
    }, [refreshTrigger]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const chats = await getChats();
            setHistory(chats);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteChat(chatId);
            setHistory(prev => prev.filter(chat => chat.id !== chatId));
        } catch (error) {
            console.error('Failed to delete chat:', error);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={cn("flex flex-col h-full bg-muted/10", className)}>
            <div className="px-4 flex items-center justify-between border-b bg-background h-14 flex-shrink-0 sticky top-0 z-10">
                <h2 className="font-semibold text-[10px] uppercase tracking-widest text-muted-foreground/70">
                    Model Wizards
                </h2>
                <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={onNewWizard} 
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    title="New Wizard"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2 w-64">
                    {loading ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            Loading...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            No wizards yet
                        </div>
                    ) : (
                        history.map((chat) => {
                            const isLoading = selectedChatId === chat.id;
                            return (
                                <div 
                                    key={chat.id} 
                                    className={cn(
                                        "p-3 border bg-card hover:border-primary/50 cursor-pointer transition-all duration-200 group relative overflow-hidden",
                                        isLoading && "opacity-50 pointer-events-none border-primary"
                                    )}
                                    onClick={() => onSelectChat?.(chat.id)}
                                >
                                    <div className="flex flex-col gap-1 z-10 relative">
                                        <div className="flex items-center gap-2">
                                            {isLoading ? (
                                                <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                            ) : (
                                                <Wand2 className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                                            )}
                                            <span className="font-medium text-sm truncate flex-1">
                                                {chat.title || 'Untitled Wizard'}
                                            </span>
                                            {!isLoading && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDelete(chat.id, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {formatDate(chat.created_at)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
