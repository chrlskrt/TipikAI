"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, Loader2, Search, Database, Code, Activity } from "lucide-react";
import { ModelResults } from "@/lib/api";

interface GenerationStage {
    id: string;
    label: string;
    icon: React.ReactNode;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
    message?: string;
}

interface StepGenerationProps {
    modelTopic: string;
    selectedSources: string[];
    outputType: 'notebook' | 'model';
    modelFormat?: string;
    results?: ModelResults;
    isGenerating?: boolean;
    currentStage?: string;
    datasetFound?: {
        name: string;
        source: string;
        rows: number;
        columns: number;
        description: string;
    };
}

export function StepGeneration({ 
    modelTopic, 
    selectedSources,
    outputType, 
    modelFormat,
    results, 
    isGenerating,
    currentStage = 'searching',
    datasetFound
}: StepGenerationProps) {
    const [stages, setStages] = React.useState<GenerationStage[]>([
        {
            id: 'searching',
            label: 'Searching for Dataset',
            icon: <Search className="h-5 w-5" />,
            status: 'in-progress',
            message: 'Analyzing your requirements and searching across multiple sources...'
        },
        {
            id: 'dataset-selected',
            label: 'Dataset Selected',
            icon: <Database className="h-5 w-5" />,
            status: 'pending',
        },
        {
            id: 'generating-code',
            label: 'Generating Model Code',
            icon: <Code className="h-5 w-5" />,
            status: 'pending',
        },
        {
            id: 'training',
            label: 'Training Model',
            icon: <Activity className="h-5 w-5" />,
            status: 'pending',
        },
    ]);

    // Update stages based on current stage
    React.useEffect(() => {
        setStages(prev => prev.map(stage => {
            const stageOrder = ['searching', 'dataset-selected', 'generating-code', 'training'];
            const currentIndex = stageOrder.indexOf(currentStage);
            const stageIndex = stageOrder.indexOf(stage.id);

            if (stageIndex < currentIndex) {
                return { ...stage, status: 'completed' as const };
            } else if (stageIndex === currentIndex) {
                return { ...stage, status: 'in-progress' as const };
            } else {
                return { ...stage, status: 'pending' as const };
            }
        }));
    }, [currentStage]);

    // Update dataset selected stage message when dataset is found
    React.useEffect(() => {
        if (datasetFound) {
            setStages(prev => prev.map(stage => 
                stage.id === 'dataset-selected' 
                    ? { 
                        ...stage, 
                        message: `Found: ${datasetFound.name} (${datasetFound.rows.toLocaleString()} rows, ${datasetFound.columns} columns)`
                      }
                    : stage
            ));
        }
    }, [datasetFound]);

    const getStatusIcon = (status: GenerationStage['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'in-progress':
                return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
            case 'error':
                return <div className="h-5 w-5 rounded-full bg-red-500" />;
            default:
                return <div className="h-5 w-5 rounded-full bg-muted" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-muted-foreground">Step 4 of 4</h3>
                <h2 className="text-base font-bold">Training Your Model</h2>
                <p className="text-xs text-muted-foreground">
                    {currentStage === 'complete' 
                        ? 'Your model has been successfully trained!' 
                        : 'Building and training your custom model'}
                </p>
            </div>

            {/* Configuration Summary */}
            <Card className="p-4 bg-muted/30">
                <h4 className="text-sm font-semibold mb-3">Configuration</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Model Purpose:</span>
                        <span className="font-medium text-right max-w-xs truncate">{modelTopic}</span>
                    </div>
                    {selectedSources.length > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Sources:</span>
                            <span className="font-medium">{selectedSources.join(', ')}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Output:</span>
                        <span className="font-medium capitalize">
                            {outputType === 'notebook' ? 'Jupyter Notebook' : `Model (${modelFormat})`}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Progress Stages */}
            <Card className="p-5">
                <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                    Progress
                </h4>
                <div className="space-y-4">
                    {stages.map((stage, index) => (
                        <div key={stage.id}>
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    {getStatusIcon(stage.status)}
                                    {index < stages.length - 1 && (
                                        <div className={`w-0.5 h-12 mt-2 ${
                                            stage.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                                        }`} />
                                    )}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <div className="font-semibold text-sm">{stage.label}</div>
                                    {stage.message && stage.status !== 'pending' && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {stage.message}
                                        </div>
                                    )}
                                    {stage.status === 'in-progress' && !stage.message && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Processing...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Dataset Details (when found) */}
            {datasetFound && currentStage !== 'searching' && (
                <Card className="p-4 border-primary/30 bg-primary/5">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                        Selected Dataset
                    </h4>
                    <div className="space-y-2">
                        <div className="font-semibold text-base">{datasetFound.name}</div>
                        <div className="text-xs text-muted-foreground">{datasetFound.description}</div>
                        <div className="flex gap-4 mt-3 text-xs">
                            <div>
                                <span className="text-muted-foreground">Source: </span>
                                <span className="font-medium">{datasetFound.source}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Rows: </span>
                                <span className="font-medium">{datasetFound.rows.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Columns: </span>
                                <span className="font-medium">{datasetFound.columns}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Model Results */}
            {results && (
                <Card className="p-4 space-y-4 border-green-500/50 bg-green-500/5">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <div>
                            <h4 className="text-lg font-bold">Model Generated Successfully</h4>
                            <p className="text-sm text-muted-foreground">Your model is ready to download</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Performance Metrics */}
                    {(results.accuracy !== undefined || results.precision !== undefined) && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                                Performance Metrics
                            </h4>
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
                    )}

                    {/* Download Section */}
                    {results.downloadUrl && (
                        <>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                                    Download
                                </h4>
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
        </div>
    );
}
