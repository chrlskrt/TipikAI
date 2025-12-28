
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dataset, ModelResults } from "@/lib/api";
import { Download, CheckCircle2, AlertCircle } from "lucide-react";

interface StepReviewProps {
    data: {
        datasets: Dataset[];
        preprocessing: any;
        outputType: 'notebook' | 'model';
    };
    results?: ModelResults;
    isGenerating?: boolean;
}

export function StepReview({ data, results, isGenerating }: StepReviewProps) {
    const { datasets, preprocessing, outputType } = data;

    if (datasets.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">Review & Generate</h3>
                <p className="text-xs text-muted-foreground">
                    {results ? 'Your model has been generated successfully!' : 'Review your configuration before starting the generation process.'}
                </p>
            </div>

            {/* Configuration Summary */}
            <Card className="p-4 space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Selected Datasets ({datasets.length})</h4>
                    <div className="space-y-3">
                        {datasets.map(ds => (
                            <div key={ds.id} className="flex justify-between items-center bg-secondary/20 p-4 rounded border border-border/50">
                                <div>
                                    <span className="font-semibold block text-base">{ds.name}</span>
                                    <span className="text-xs text-muted-foreground mt-1 block">{ds.source}</span>
                                </div>
                                <span className="text-xs bg-muted px-3 py-1.5 rounded font-medium">{ds.rows} rows</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <Separator />

                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Preprocessing</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <li className="flex items-center gap-3 p-3 bg-muted/30 rounded">
                            <div className={`w-2.5 h-2.5 rounded-full ${preprocessing.handleMissing ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>Handle Missing Values</span>
                        </li>
                        <li className="flex items-center gap-3 p-3 bg-muted/30 rounded">
                             <div className={`w-2.5 h-2.5 rounded-full ${preprocessing.normalize ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>Normalize Features</span>
                        </li>
                        <li className="flex items-center gap-3 p-3 bg-muted/30 rounded">
                             <div className={`w-2.5 h-2.5 rounded-full ${preprocessing.encodeCategorical ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>Encode Categorical</span>
                        </li>
                    </ul>
                </div>

                <Separator />

                <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Output</h4>
                    <div className="font-semibold text-base capitalize bg-muted/30 p-4 rounded">{outputType === 'notebook' ? 'Jupyter Notebook Code' : 'Deployed Model API'}</div>
                </div>
            </Card>

            {/* Model Results */}
            {results && (
                <Card className="p-4 space-y-4 border-green-500/50 bg-green-500/5">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <div>
                            <h4 className="text-lg font-bold">Model Generated Successfully</h4>
                            <p className="text-sm text-muted-foreground">Your binary classification model is ready</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Performance Metrics */}
                    <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Performance Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {results.accuracy !== undefined && (
                                <div className="bg-muted/30 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-primary">{(results.accuracy * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground mt-1">Accuracy</div>
                                </div>
                            )}
                            {results.precision !== undefined && (
                                <div className="bg-muted/30 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-primary">{(results.precision * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground mt-1">Precision</div>
                                </div>
                            )}
                            {results.recall !== undefined && (
                                <div className="bg-muted/30 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-primary">{(results.recall * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground mt-1">Recall</div>
                                </div>
                            )}
                            {results.f1Score !== undefined && (
                                <div className="bg-muted/30 p-4 rounded text-center">
                                    <div className="text-2xl font-bold text-primary">{(results.f1Score * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground mt-1">F1 Score</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Confusion Matrix */}
                    {results.confusionMatrix && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Confusion Matrix</h4>
                                <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                                    <div className="bg-green-500/20 p-4 rounded text-center border border-green-500/30">
                                        <div className="text-xl font-bold">{results.confusionMatrix?.[0]?.[0] ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">True Negative</div>
                                    </div>
                                    <div className="bg-red-500/20 p-4 rounded text-center border border-red-500/30">
                                        <div className="text-xl font-bold">{results.confusionMatrix?.[0]?.[1] ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">False Positive</div>
                                    </div>
                                    <div className="bg-red-500/20 p-4 rounded text-center border border-red-500/30">
                                        <div className="text-xl font-bold">{results.confusionMatrix?.[1]?.[0] ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">False Negative</div>
                                    </div>
                                    <div className="bg-green-500/20 p-4 rounded text-center border border-green-500/30">
                                        <div className="text-xl font-bold">{results.confusionMatrix?.[1]?.[1] ?? 0}</div>
                                        <div className="text-xs text-muted-foreground mt-1">True Positive</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Download Section */}
                    {results.downloadUrl && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Download</h4>
                                <Button className="w-full" size="lg" asChild>
                                    <a href={results.downloadUrl} download>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download {outputType === 'notebook' ? 'Jupyter Notebook' : 'Model File'}
                                    </a>
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            )}

            {/* Loading State */}
            {isGenerating && (
                <Card className="p-6 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <div>
                            <h4 className="text-lg font-bold">Generating Your Model...</h4>
                            <p className="text-sm text-muted-foreground">This may take a few moments. Please wait.</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
