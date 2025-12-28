
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Database, CheckCircle, Filter } from "lucide-react";
import { searchDatasets, Dataset } from "@/lib/api";

interface StepDatasetProps {
    onToggle: (dataset: Dataset) => void;
    selectedDatasets: Dataset[];
}

export function StepDataset({ onToggle, selectedDatasets }: StepDatasetProps) {
    const [query, setQuery] = React.useState("");
    const [selectedSources, setSelectedSources] = React.useState<string[]>([]);
    const [results, setResults] = React.useState<Dataset[]>([]);
    const [loading, setLoading] = React.useState(false);

    const availableSources = ['Kaggle', 'UCI Machine Learning Repository', 'Hugging Face'];

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await searchDatasets(query, selectedSources);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">1. Select a Dataset</h3>
                <p className="text-xs text-muted-foreground">Search for a dataset to train your binary classification model on.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search datasets (e.g., Titanic, Iris)..." 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pl-10 h-10 text-sm bg-card border-muted-foreground/20"
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loading} className="w-full md:w-auto h-10 px-6 text-sm">
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
                
                <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Sources</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableSources.map(source => (
                            <Badge 
                                key={source}
                                variant={selectedSources.includes(source) ? "default" : "outline"}
                                className={`cursor-pointer transition-all px-3 py-1 text-xs ${selectedSources.includes(source) ? 'hover:bg-primary/90' : 'bg-card hover:bg-accent border-muted-foreground/20'}`}
                                onClick={() => {
                                    setSelectedSources(prev => 
                                        prev.includes(source) 
                                            ? prev.filter(s => s !== source)
                                            : [...prev, source]
                                    )
                                }}
                            >
                                {source}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-3">
                {results.map((dataset) => {
                    const isSelected = selectedDatasets.some(d => d.id === dataset.id);
                    return (
                        <Card 
                            key={dataset.id} 
                            className={`group relative p-5 cursor-pointer transition-all hover:shadow-md border-2 ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                            onClick={() => onToggle(dataset)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-md transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                        <Database className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base flex items-center gap-2">
                                            {dataset.name}
                                            {isSelected && <CheckCircle className="w-4 h-4 text-primary animate-in fade-in zoom-in" />}
                                        </h4>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 max-w-md">{dataset.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-3">
                                            <Badge variant="secondary" className="font-normal text-xs">{dataset.source}</Badge>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="font-medium text-foreground">{dataset.rows.toLocaleString()}</span> rows
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="font-medium text-foreground">{dataset.columns}</span> columns
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                     <Button size="sm" variant={isSelected ? "default" : "outline"} className="pointer-events-none">
                                        {isSelected ? 'Selected' : 'Select'}
                                     </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {results.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Database className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">No datasets found</p>
                        <p className="text-sm opacity-60">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
