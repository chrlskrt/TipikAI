"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Check, FileCode, Package, Cpu, Brain, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepModelFormatProps {
    modelFormat: string;
    onModelFormatChange: (format: string) => void;
}

export function StepModelFormat({ 
    modelFormat, 
    onModelFormatChange 
}: StepModelFormatProps) {
    const modelFormats = [
        { 
            value: 'pickle', 
            label: 'Pickle', 
            extension: '.pkl',
            description: 'Standard Python serialization format',
            icon: Package,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/50'
        },
        { 
            value: 'joblib', 
            label: 'Joblib', 
            extension: '.joblib',
            description: 'Efficient for large numpy arrays',
            icon: Boxes,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/50'
        },
        { 
            value: 'h5', 
            label: 'HDF5', 
            extension: '.h5',
            description: 'Hierarchical data format for Keras',
            icon: FileCode,
            color: 'text-cyan-500',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/50'
        },
        { 
            value: 'onnx', 
            label: 'ONNX', 
            extension: '.onnx',
            description: 'Cross-platform model format',
            icon: Cpu,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/50'
        },
        { 
            value: 'tensorflow', 
            label: 'TensorFlow', 
            extension: 'SavedModel',
            description: 'TensorFlow native format',
            icon: Brain,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/50'
        },
        { 
            value: 'pytorch', 
            label: 'PyTorch', 
            extension: '.pt',
            description: 'PyTorch native format',
            icon: Brain,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/50'
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-muted-foreground">Step 3 of 4</h3>
                <h2 className="text-base font-bold">Choose Model Format</h2>
                <p className="text-xs text-muted-foreground">Select the format for your trained model file</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modelFormats.map((format) => {
                    const Icon = format.icon;
                    const isSelected = modelFormat === format.value;
                    
                    return (
                        <Card
                            key={format.value}
                            className={cn(
                                "relative p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                                "border-2",
                                isSelected 
                                    ? `${format.borderColor} bg-accent/50 shadow-sm` 
                                    : "border-border hover:border-primary/30"
                            )}
                            onClick={() => onModelFormatChange(format.value)}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className={cn(
                                        "rounded-full p-1",
                                        format.bgColor
                                    )}>
                                        <Check className={cn("h-3 w-3", format.color)} />
                                    </div>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                                format.bgColor
                            )}>
                                <Icon className={cn("h-6 w-6", format.color)} />
                            </div>

                            {/* Content */}
                            <div className="space-y-1">
                                <div className="font-semibold text-sm">
                                    {format.label}
                                </div>
                                <div className={cn(
                                    "text-xs font-mono",
                                    isSelected ? format.color : "text-muted-foreground"
                                )}>
                                    {format.extension}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {format.description}
                                </p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Selected format info */}
            <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                        <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium">
                            Selected: {modelFormats.find(f => f.value === modelFormat)?.label}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            You'll receive a ready-to-use trained model file in this format, perfect for deployment and immediate use in production.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
