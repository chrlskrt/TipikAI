"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface StepModelTopicProps {
    modelTopic: string;
    onTopicChange: (topic: string) => void;
}

export function StepModelTopic({ 
    modelTopic, 
    onTopicChange
}: StepModelTopicProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-muted-foreground">Step 1 of 4</h3>
                <h2 className="text-base font-bold">What would you like to create?</h2>
                <p className="text-xs text-muted-foreground">Describe your model topic or use case</p>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-xl border space-y-5">
                <div className="space-y-3">
                    <Label htmlFor="model-topic" className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        What will your model predict?
                    </Label>
                    <Textarea 
                        id="model-topic"
                        placeholder="E.g., Predict customer churn, classify sentiment in reviews, detect fraud in transactions..."
                        value={modelTopic}
                        onChange={(e) => onTopicChange(e.target.value)}
                        className="min-h-[120px] text-sm bg-card border-muted-foreground/20 resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        Be specific about what you want to predict. The more details you provide, the better dataset we can find.
                    </p>
                </div>
            </div>
        </div>
    );
}
