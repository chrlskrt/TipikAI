"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, CheckCircle2, Database, AlertCircle, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StepDatasetProgressProps {
    modelTopic: string;
    selectedSources: string[];
    datasetFound?: {
        name: string;
        source: string;
        rows: number;
        columns: number;
        description: string;
    };
    isSearching: boolean;
    searchError: string | null;
    onComplete?: () => void;
    onSearch: () => Promise<void>;
}

export function StepDatasetProgress({ 
    modelTopic, 
    selectedSources, 
    datasetFound, 
    isSearching,
    searchError,
    onComplete, 
    onSearch 
}: StepDatasetProgressProps) {
    const [progress, setProgress] = React.useState(0);
    const [currentPhase, setCurrentPhase] = React.useState<'searching' | 'downloading' | 'complete' | 'error'>('searching');

    // Trigger search on mount
    React.useEffect(() => {
        onSearch();
    }, []); // Only run once on mount

    // Simulate progress while searching
    React.useEffect(() => {
        if (isSearching) {
            setCurrentPhase('searching');
            setProgress(0);
            
            // Slowly increment progress while waiting for backend
            const interval = setInterval(() => {
                setProgress(prev => {
                    // Slow down as we approach 90% to avoid reaching 100% before backend responds
                    if (prev < 30) return prev + 3;
                    if (prev < 60) return prev + 2;
                    if (prev < 85) return prev + 1;
                    return prev; // Stop at 85% until we get response
                });
            }, 500);
            
            return () => clearInterval(interval);
        }
    }, [isSearching]);

    // Handle search completion or error
    React.useEffect(() => {
        if (!isSearching) {
            if (searchError) {
                setCurrentPhase('error');
                setProgress(0);
            } else if (datasetFound) {
                // Complete the progress animation but DON'T auto-advance
                const completeProgress = async () => {
                    setCurrentPhase('downloading');
                    
                    // Quick jump to 100%
                    for (let i = progress; i <= 100; i += 10) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        setProgress(i);
                    }
                    
                    setCurrentPhase('complete');
                    // Don't call onComplete() - let user click Next button
                };
                
                completeProgress();
            }
        }
    }, [isSearching, searchError, datasetFound, progress]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-muted-foreground">Step 2 of 4</h3>
                <h2 className="text-base font-bold">Finding Your Dataset</h2>
                <p className="text-xs text-muted-foreground">
                    Searching for the perfect dataset and preparing it for model training
                </p>
            </div>

            {/* Progress Card */}
            <Card className="p-6 space-y-6">
                {/* Current Phase */}
                <div className="flex items-center gap-3">
                    {currentPhase === 'complete' ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : currentPhase === 'error' ? (
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    ) : (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    )}
                    <div className="flex-1">
                        <div className="font-semibold text-base">
                            {currentPhase === 'searching' && 'Searching for datasets...'}
                            {currentPhase === 'downloading' && 'Downloading dataset...'}
                            {currentPhase === 'complete' && 'Dataset ready!'}
                            {currentPhase === 'error' && 'Failed to find dataset'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {currentPhase === 'searching' && `Looking for: ${modelTopic}`}
                            {currentPhase === 'downloading' && 'Preparing data for training'}
                            {currentPhase === 'complete' && 'Ready to configure model'}
                            {currentPhase === 'error' && (searchError || 'An error occurred during the search')}
                        </div>
                    </div>
                    {currentPhase !== 'error' && (
                        <div className="text-2xl font-bold text-primary">
                            {progress}%
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {currentPhase !== 'error' && <Progress value={progress} className="h-2" />}

                {/* Error State */}
                {currentPhase === 'error' && (
                    <div className="pt-4 border-t space-y-4">
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive font-medium">
                                {searchError || 'Unable to search for datasets'}
                            </p>
                            <p className="text-xs text-destructive/80 mt-2">
                                This could be due to:
                            </p>
                            <ul className="text-xs text-destructive/80 mt-1 ml-4 list-disc space-y-1">
                                <li>Network connection issues</li>
                                <li>API service unavailable</li>
                                <li>Authentication problems</li>
                            </ul>
                        </div>
                        <Button 
                            onClick={onSearch} 
                            variant="outline" 
                            className="w-full"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry Search
                        </Button>
                    </div>
                )}

                {/* Dataset Info (shown when found) */}
                {datasetFound && currentPhase !== 'error' && (
                    <div className="pt-4 border-t animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                                <Database className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-sm">{datasetFound.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Source: {datasetFound.source}
                                </div>
                                {datasetFound.description && (
                                    <div className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        {datasetFound.description}
                                    </div>
                                )}
                                {datasetFound.rows > 0 && (
                                    <div className="flex gap-4 mt-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Rows: </span>
                                            <span className="font-medium">{datasetFound.rows.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Columns: </span>
                                            <span className="font-medium">{datasetFound.columns}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Messages */}
                {currentPhase !== 'error' && (
                    <div className="space-y-2 text-xs">
                        <div className={`flex items-center gap-2 ${progress >= 20 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {progress >= 20 ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border-2 border-current" />}
                            <span>Analyzing requirements</span>
                        </div>
                        <div className={`flex items-center gap-2 ${progress >= 40 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {progress >= 40 ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border-2 border-current" />}
                            <span>Dataset found and validated</span>
                        </div>
                        <div className={`flex items-center gap-2 ${progress >= 70 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {progress >= 70 ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border-2 border-current" />}
                            <span>Downloading and preprocessing</span>
                        </div>
                        <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {progress >= 100 ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border-2 border-current" />}
                            <span>Ready for model configuration</span>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
