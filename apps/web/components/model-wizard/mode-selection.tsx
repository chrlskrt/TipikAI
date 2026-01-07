"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Zap, ArrowRight } from "lucide-react";

interface ModeSelectionProps {
    onSelectMode: (mode: 'one-prompt' | 'step-by-step') => void;
}

export function ModeSelection({ onSelectMode }: ModeSelectionProps) {
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="max-w-5xl w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight">Choose Your Creation Method</h2>
                    <p className="text-lg text-muted-foreground">
                        How would you like to generate your model?
                    </p>
                </div>

                {/* Mode Cards */}
                <div className="flex justify-center">
                    {/* One Prompt Card */}
                    <Card className="max-w-md w-full group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer">
                        <div 
                            className="p-8 space-y-6"
                            onClick={() => onSelectMode('one-prompt')}
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Zap className="h-8 w-8 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold">One Prompt</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Provide a single prompt and let our AI generate your model. Fast and efficient.
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                    <span>Single prompt input</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                    <span>Instant model generation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                    <span>Best for quick models</span>
                                </li>
                            </ul>

                            {/* Button */}
                            <Button 
                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                size="lg"
                            >
                                Generate Model
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </Card>

                    {/* Step-by-Step Card */}
                    <Card className="max-w-md w-full group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer">
                        <div 
                            className="p-8 space-y-6"
                            onClick={() => onSelectMode('step-by-step')}
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <MessageSquare className="h-8 w-8 text-primary" />
                            </div>

                            {/* Content */}
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold">Step-by-Step Walkthrough</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Chat with our AI assistant to guide you through the model creation process. Interactive and helpful.
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                    <span>Interactive chat interface</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                    <span>Guided step-by-step process</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                                    <span>Best for beginners</span>
                                </li>
                            </ul>

                            {/* Button */}
                            <Button 
                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                size="lg"
                            >
                                Start Chatting
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
