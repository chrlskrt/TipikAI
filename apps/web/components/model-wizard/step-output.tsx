"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileCode, Activity, CheckCircle2, Loader2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { configureOutput, ConfigureOutputResponse, PreprocessingOptions } from "@/lib/api";

interface StepOutputProps {
    value: 'notebook' | 'model';
    onChange: (value: 'notebook' | 'model') => void;
    selectedDatasetIds?: string[];
    preprocessing?: PreprocessingOptions;
}

export function StepOutput({ value, onChange, selectedDatasetIds = [], preprocessing }: StepOutputProps) {
    const [configuration, setConfiguration] = React.useState<ConfigureOutputResponse | null>(null);
    const [isConfiguring, setIsConfiguring] = React.useState(false);

    // Configure output when selection changes
    React.useEffect(() => {
        if (selectedDatasetIds.length === 0 || !preprocessing) return;

        const configure = async () => {
            setIsConfiguring(true);
            try {
                const result = await configureOutput(selectedDatasetIds, preprocessing, value);
                setConfiguration(result);
            } catch (error) {
                console.error('Configuration failed:', error);
            } finally {
                setIsConfiguring(false);
            }
        };

        // Debounce configuration
        const timer = setTimeout(configure, 300);
        return () => clearTimeout(timer);
    }, [value, selectedDatasetIds, preprocessing]);

    return (
        <div className="space-y-4">
             <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">3. Choose Output Format</h3>
                <p className="text-xs text-muted-foreground">Decide how you want to receive the result.</p>
            </div>

            <RadioGroup value={value} onValueChange={(v) => onChange(v as 'notebook' | 'model')} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <RadioGroupItem value="notebook" id="notebook" className="peer sr-only" />
                    <Label
                        htmlFor="notebook"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                    >
                        <FileCode className="mb-3 h-7 w-7" />
                        <div className="text-center space-y-1">
                            <div className="font-semibold text-base">Jupyter Notebook</div>
                            <span className="text-xs text-muted-foreground leading-relaxed">Get the complete code to run locally or on Colab.</span>
                        </div>
                    </Label>
                </div>

                <div>
                    <RadioGroupItem value="model" id="model" className="peer sr-only" />
                    <Label
                        htmlFor="model"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full transition-all"
                    >
                        <Activity className="mb-3 h-7 w-7" />
                        <div className="text-center space-y-1">
                            <div className="font-semibold text-base">Deployed Model API</div>
                            <span className="text-xs text-muted-foreground leading-relaxed">Get a ready-to-use prediction API endpoint.</span>
                        </div>
                    </Label>
                </div>
            </RadioGroup>

            {/* Configuration Feedback */}
            {isConfiguring && (
                <Card className="p-4 border-primary/50 bg-primary/5">
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-muted-foreground">Configuring output...</span>
                    </div>
                </Card>
            )}

            {!isConfiguring && configuration && configuration.configured && (
                <Card className="p-4 border-green-500/50 bg-green-500/5">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Configuration Complete</div>
                            {configuration.message && (
                                <div className="text-xs text-muted-foreground mt-1">{configuration.message}</div>
                            )}
                            {configuration.estimatedTime && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Estimated time: {configuration.estimatedTime}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
