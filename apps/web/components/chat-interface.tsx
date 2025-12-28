
"use client";

import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
    className?: string;
    onNewCreation: () => void;
}

export function ChatInterface({ className, onNewCreation }: ChatInterfaceProps) {
    const [history, setHistory] = React.useState([
        { id: '1', title: 'Titanic Survival Model', date: '2 mins ago', status: 'completed' },
        { id: '2', title: 'Iris Species Classification', date: '1 hour ago', status: 'failed' },
        { id: '3', title: 'Customer Churn Prediction', date: '5 hours ago', status: 'completed' },
    ]);

    return (
        <div className={cn("flex flex-col h-full bg-muted/10", className)}>
            <div className="p-4 flex items-center justify-between border-b bg-background h-14">
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Creations</h2>
                <Button size="icon" variant="ghost" onClick={onNewCreation} className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {history.map((item) => (
                        <div 
                            key={item.id} 
                            className="p-3 border bg-card hover:border-primary/50 cursor-pointer transition-all duration-200 group relative overflow-hidden"
                        >
                             <div className="flex flex-col gap-1 z-10 relative">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors" />
                                    <span className="font-medium text-sm truncate">{item.title}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center text-[10px] text-muted-foreground">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {item.date}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 font-medium border",
                                        item.status === 'completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                                        item.status === 'failed' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                    )}>
                                        {item.status}
                                    </span>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
