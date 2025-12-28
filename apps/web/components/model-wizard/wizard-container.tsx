
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dataset, generateModel, ModelResults } from "@/lib/api";
import { StepDataset } from "./step-dataset";
import { StepPreprocessing } from "./step-preprocessing";
import { StepOutput } from "./step-output";
import { StepReview } from "./step-review";
import { ChevronRight, ChevronLeft, Loader2, Sparkles, Wand2 } from "lucide-react";

export function WizardContainer() {
    const [step, setStep] = React.useState(1);
    const [selectedDatasets, setSelectedDatasets] = React.useState<Dataset[]>([]);
    const [preprocessing, setPreprocessing] = React.useState({
        handleMissing: true,
        normalize: true,
        encodeCategorical: true,
    });
    const [outputType, setOutputType] = React.useState<'notebook' | 'model'>('notebook');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [modelResults, setModelResults] = React.useState<ModelResults | undefined>(undefined);
    const [workflowId, setWorkflowId] = React.useState<string | null>(null);

    const totalSteps = 4;

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleGenerate = async () => {
        if (selectedDatasets.length === 0) return;
        setIsGenerating(true);
        setModelResults(undefined); // Clear previous results
        try {
            const response = await generateModel(
                selectedDatasets.map(d => d.id), 
                preprocessing, 
                outputType
            );
            setWorkflowId(response.workflowId);
            if (response.status === 'completed' && response.results) {
                setModelResults(response.results);
            }
        } catch (error) {
            console.error('Model generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-generate model when reaching Step 4
    React.useEffect(() => {
        if (step === 4 && selectedDatasets.length > 0 && !modelResults && !isGenerating) {
            handleGenerate();
        }
    }, [step]);

    const canProceed = () => {
        if (step === 1) return selectedDatasets.length > 0;
        return true;
    };

    const handleDatasetToggle = (dataset: Dataset) => {
        setSelectedDatasets(prev => {
            const exists = prev.find(d => d.id === dataset.id);
            if (exists) {
                return prev.filter(d => d.id !== dataset.id);
            }
            return [...prev, dataset];
        });
    };

    return (
        <div className="w-full h-full flex flex-col">
            <Card className="flex flex-col border bg-card h-full">
                {/* Header / Progress */}
                <div className="p-10 border-b">
                     <div className="flex items-center gap-5 mb-10">
                        <div className="p-4 bg-primary/10">
                            <Wand2 className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-2xl">Model Generator</h2>
                            <p className="text-base text-muted-foreground mt-2">Follow the steps to create your custom model</p>
                        </div>
                    </div>
                    
                    <div className="relative pt-2">
                        <div className="flex justify-between text-sm font-semibold text-muted-foreground mb-4 px-1">
                            <span>Configuration</span>
                            <span>{Math.round((step / totalSteps) * 100)}% Complete</span>
                        </div>
                        <div className="h-3 bg-secondary overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-300 ease-out" 
                                style={{ width: `${(step / totalSteps) * 100}%` }} 
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-12 flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300 key={step}"> 
                        {step === 1 && <StepDataset onToggle={handleDatasetToggle} selectedDatasets={selectedDatasets} />}
                        {step === 2 && (
                            <StepPreprocessing 
                                options={preprocessing} 
                                setOptions={setPreprocessing}
                                selectedDatasetIds={selectedDatasets.map(d => d.id)}
                            />
                        )}
                        {step === 3 && (
                            <StepOutput 
                                value={outputType} 
                                onChange={setOutputType}
                                selectedDatasetIds={selectedDatasets.map(d => d.id)}
                                preprocessing={preprocessing}
                            />
                        )}
                        {step === 4 && (
                            <StepReview 
                                data={{ datasets: selectedDatasets, preprocessing, outputType }} 
                                results={modelResults}
                                isGenerating={isGenerating}
                            />
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-10 border-t bg-muted/5 flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        onClick={handleBack} 
                        // disabled={step === 1 || isGenerating}
                        className="px-6"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    
                    <div className="flex gap-2">
                         {step < totalSteps && (
                            <Button 
                                onClick={handleNext} 
                                // disabled={!canProceed()}
                                className="px-8"
                            >
                                Next <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
