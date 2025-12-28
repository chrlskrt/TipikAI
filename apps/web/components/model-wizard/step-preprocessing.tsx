
"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Need to install switch
import { Checkbox } from "@/components/ui/checkbox"; // Need to install checkbox
import { Card } from "@/components/ui/card";
import { validatePreprocessing, ValidatePreprocessingResponse } from "@/lib/api";
import { AlertCircle, CheckCircle2, Lightbulb, Loader2 } from "lucide-react";

interface StepPreprocessingProps {
    options: any;
    setOptions: (options: any) => void;
    selectedDatasetIds?: string[];
}

export function StepPreprocessing({ options, setOptions, selectedDatasetIds = [] }: StepPreprocessingProps) {
    const [validation, setValidation] = React.useState<ValidatePreprocessingResponse | null>(null);
    const [isValidating, setIsValidating] = React.useState(false);

    const handleToggle = (key: string) => {
        setOptions({ ...options, [key]: !options[key] });
    };

    // Validate preprocessing options when they change
    React.useEffect(() => {
        if (selectedDatasetIds.length === 0) return;

        const validateOptions = async () => {
            setIsValidating(true);
            try {
                const result = await validatePreprocessing(selectedDatasetIds, options);
                setValidation(result);
            } catch (error) {
                console.error('Validation failed:', error);
            } finally {
                setIsValidating(false);
            }
        };

        // Debounce validation
        const timer = setTimeout(validateOptions, 500);
        return () => clearTimeout(timer);
    }, [options, selectedDatasetIds]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">2. Preprocessing Options</h3>
                <p className="text-xs text-muted-foreground">Select how you want to clean and prepare your data.</p>
            </div>

            <div className="grid gap-3">
                <Card className="p-4 flex flex-row items-center justify-between space-x-4 hover:bg-accent/50 transition-colors">
                    <Label htmlFor="handle-missing" className="flex flex-col space-y-1 cursor-pointer">
                        <span className="font-medium text-sm">Handle Missing Values</span>
                        <span className="font-normal text-xs text-muted-foreground leading-relaxed">Automatically impute or drop missing data.</span>
                    </Label>
                    <input 
                        type="checkbox" 
                        id="handle-missing" 
                        className="h-5 w-5 cursor-pointer"
                        checked={options.handleMissing} 
                        onChange={() => handleToggle('handleMissing')} 
                    />
                </Card>

                <Card className="p-4 flex flex-row items-center justify-between space-x-4 hover:bg-accent/50 transition-colors">
                    <Label htmlFor="normalize" className="flex flex-col space-y-1 cursor-pointer">
                        <span className="font-medium text-sm">Normalize/Scale Features</span>
                        <span className="font-normal text-xs text-muted-foreground leading-relaxed">Scale numerical features to a standard range.</span>
                    </Label>
                    <input 
                        type="checkbox" 
                        id="normalize"
                         className="h-5 w-5 cursor-pointer"
                        checked={options.normalize} 
                        onChange={() => handleToggle('normalize')} 
                    />
                </Card>

                <Card className="p-4 flex flex-row items-center justify-between space-x-4 hover:bg-accent/50 transition-colors">
                    <Label htmlFor="encode-categorical" className="flex flex-col space-y-1 cursor-pointer">
                        <span className="font-medium text-sm">Encode Categorical Variables</span>
                        <span className="font-normal text-xs text-muted-foreground leading-relaxed">Convert text labels to numerical values.</span>
                    </Label>
                    <input 
                        type="checkbox" 
                        id="encode-categorical"
                         className="h-5 w-5 cursor-pointer"
                        checked={options.encodeCategorical} 
                        onChange={() => handleToggle('encodeCategorical')} 
                    />
                </Card>
            </div>

            {/* Validation Feedback */}
            {isValidating && (
                <Card className="p-4 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-muted-foreground">Validating options...</span>
                    </div>
                </Card>
            )}

            {!isValidating && validation && (
                <div className="space-y-3">
                    {/* Success */}
                    {validation.valid && !validation.warnings?.length && (
                        <Card className="p-4 border-green-500/50 bg-green-500/5">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                    <div className="font-medium text-sm">Configuration Valid</div>
                                    <div className="text-xs text-muted-foreground mt-1">Your preprocessing options are ready to use.</div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Warnings */}
                    {validation.warnings && validation.warnings.length > 0 && (
                        <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium text-sm mb-2">Warnings</div>
                                    <ul className="space-y-1">
                                        {validation.warnings.map((warning, idx) => (
                                            <li key={idx} className="text-xs text-muted-foreground">• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Suggestions */}
                    {validation.suggestions && validation.suggestions.length > 0 && (
                        <Card className="p-4 border-blue-500/50 bg-blue-500/5">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-medium text-sm mb-2">Suggestions</div>
                                    <ul className="space-y-1">
                                        {validation.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="text-xs text-muted-foreground">• {suggestion}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
