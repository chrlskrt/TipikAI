
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createChat, startExecution, getExecutionStatus, cancelExecution, retryExecution, type ExecutionStatus } from "@/lib/api";
import { Wand2, Loader2 } from "lucide-react";

interface WizardContainerProps {
  loadedChatId?: string;
  loadedChatTitle?: string;
  loadedExecutionId?: string;
}

export function WizardContainer({ loadedChatId, loadedChatTitle, loadedExecutionId }: WizardContainerProps = {}) {
  const [modelPrompt, setModelPrompt] = React.useState(loadedChatTitle || "");
  const [modelFormat, setModelFormat] = React.useState("pickle");
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(loadedChatId || null);
  const [executionId, setExecutionId] = React.useState<string | null>(loadedExecutionId || null);
  const [executionStatus, setExecutionStatus] = React.useState<ExecutionStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingExecution, setIsLoadingExecution] = React.useState(false);

  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('access_token');

  // Determine if prompt should be disabled (when loading from history)
  const isPromptDisabled = !!loadedChatId;

  // Load execution if executionId is provided
  React.useEffect(() => {
    if (loadedExecutionId) {
      setIsLoadingExecution(true);
      getExecutionStatus(loadedExecutionId)
        .then(status => {
          setExecutionStatus(status);
          setExecutionId(loadedExecutionId);
        })
        .catch(error => {
          console.error('Failed to load execution:', error);
        })
        .finally(() => {
          setIsLoadingExecution(false);
        });
    }
  }, [loadedExecutionId]);

  // Adaptive polling based on status
  const getPollingInterval = (status: string) => {
    if (status === 'downloading' || status === 'preprocessing') {
      return 5000; // 5 seconds for long-running stages
    }
    return 3000; // 3 seconds default
  };

  // Polling mechanism
  React.useEffect(() => {
    if (!executionId) return;

    const poll = async () => {
      try {
        const status = await getExecutionStatus(executionId);
        setExecutionStatus(status);

        // Stop polling if execution is complete, failed, or cancelled
        if (['complete', 'failed', 'cancelled'].includes(status.status)) {
          return;
        }
      } catch (error) {
        console.error('Failed to poll execution status:', error);
      }
    };

    // Initial poll
    poll();

    // Set up interval based on current status
    const interval = setInterval(poll, getPollingInterval(executionStatus?.status || ''));

    return () => clearInterval(interval);
  }, [executionId, executionStatus?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!modelPrompt.trim()) return;

    setIsSubmitting(true);

    try {
      // Create chat if logged in
      let chatId = currentChatId;
      if (isLoggedIn && !chatId) {
        const chat = await createChat(modelPrompt.trim());
        chatId = chat.id;
        setCurrentChatId(chatId);
      }

      // Start execution
      const execution = await startExecution({
        modelPrompt: modelPrompt.trim(),
        modelFormat,
        chatId: chatId || undefined,
      });

      setExecutionId(execution.id);
      setExecutionStatus(execution);
    } catch (error) {
      console.error('Failed to start execution:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!executionId) return;

    try {
      const status = await cancelExecution(executionId);
      setExecutionStatus(status);
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };

  const handleRetry = async () => {
    if (!executionId) return;

    try {
      const status = await retryExecution(executionId);
      setExecutionStatus(status);
    } catch (error) {
      console.error('Failed to retry execution:', error);
    }
  };

  const handleNewExecution = () => {
    setExecutionId(null);
    setExecutionStatus(null);
    setModelPrompt("");
    setModelFormat("pickle");
  };

  const isExecuting = executionStatus && !['complete', 'failed', 'cancelled'].includes(executionStatus.status);

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex flex-col border bg-card h-full">
        {/* Header */}
        <div className="p-7 border-b">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-4 bg-primary/10">
              <Wand2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-2xl">Model Generator</h2>
              <p className="text-base text-muted-foreground mt-2">
                {executionStatus ? 'Execution in progress' : 'Create your custom model'}
              </p>
            </div>
          </div>

          {executionStatus && (
            <div className="relative pt-2">
              <div className="flex justify-between text-sm font-semibold text-muted-foreground mb-4 px-1">
                <span>{executionStatus.currentStage || executionStatus.status}</span>
                <span>{executionStatus.progress}% Complete</span>
              </div>
              <div className="h-3 bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${executionStatus.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-12 flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {isLoadingExecution ? (
              /* Loading State */
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !executionStatus ? (
              /* Initial Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="modelPrompt">Model Prompt</Label>
                  <Textarea
                    id="modelPrompt"
                    placeholder="E.g., customer churn prediction model"
                    value={modelPrompt}
                    onChange={(e) => setModelPrompt(e.target.value)}
                    rows={4}
                    className="resize-none"
                    disabled={isPromptDisabled}
                  />
                  {isPromptDisabled && (
                    <p className="text-xs text-muted-foreground">
                      Prompt is set from chat history
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelFormat">Model Format</Label>
                  <Select value={modelFormat} onValueChange={setModelFormat}>
                    <SelectTrigger id="modelFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickle">
                        <div className="flex gap-5 items-baseline">
                          <span className="font-medium">Pickle (.pkl)</span>
                          <span className="text-xs text-muted-foreground">Python-only, fast, best for scikit-learn models</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="onnx">
                        <div className="flex gap-5 items-baseline">
                          <span className="font-medium">ONNX (.onnx)</span>
                          <span className="text-xs text-muted-foreground">Cross-platform, optimized for production deployment</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="tensorflow">
                        <div className="flex gap-5 items-baseline">
                          <span className="font-medium">TensorFlow (.h5)</span>
                          <span className="text-xs text-muted-foreground">Deep learning, TensorFlow/Keras ecosystem</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pytorch">
                        <div className="flex gap-5 items-baseline">
                          <span className="font-medium">PyTorch (.pt)</span>
                          <span className="text-xs text-muted-foreground">Deep learning, PyTorch ecosystem, research-friendly</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {modelFormat === 'pickle' && '💡 Best for Python-only projects with scikit-learn models'}
                    {modelFormat === 'onnx' && '💡 Best for cross-platform deployment and production environments'}
                    {modelFormat === 'tensorflow' && '💡 Best for deep learning models using TensorFlow/Keras'}
                    {modelFormat === 'pytorch' && '💡 Best for deep learning research and PyTorch models'}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!modelPrompt.trim() || isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isPromptDisabled ? 'Start New Execution' : 'Generate Model'}
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* Execution Status Display */
              <div className="space-y-6">
                {/* Dataset Info */}
                {executionStatus.datasetInfo && (
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Dataset Found</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Title:</span> {executionStatus.datasetInfo.title}
                      </div>
                      <div>
                        <span className="font-medium">Source:</span> {executionStatus.datasetInfo.source}
                      </div>
                      <div>
                        <span className="font-medium">Description:</span> {executionStatus.datasetInfo.description}
                      </div>
                      <div>
                        <a
                          href={executionStatus.datasetInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Dataset →
                        </a>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Results */}
                {executionStatus.results && (
                  <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Results</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {executionStatus.results.accuracy !== undefined && (
                        <div>
                          <span className="font-medium">Accuracy:</span> {(executionStatus.results.accuracy * 100).toFixed(2)}%
                        </div>
                      )}
                      {executionStatus.results.precision !== undefined && (
                        <div>
                          <span className="font-medium">Precision:</span> {(executionStatus.results.precision * 100).toFixed(2)}%
                        </div>
                      )}
                      {executionStatus.results.recall !== undefined && (
                        <div>
                          <span className="font-medium">Recall:</span> {(executionStatus.results.recall * 100).toFixed(2)}%
                        </div>
                      )}
                      {executionStatus.results.f1Score !== undefined && (
                        <div>
                          <span className="font-medium">F1 Score:</span> {(executionStatus.results.f1Score * 100).toFixed(2)}%
                        </div>
                      )}
                    </div>

                    {executionStatus.results.files && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Downloads</h4>
                        <div className="flex gap-3">
                          <Button asChild>
                            <a href={executionStatus.results.files.model.url} download>
                              Download Model ({(executionStatus.results.files.model.size / 1024 / 1024).toFixed(2)} MB)
                            </a>
                          </Button>
                          <Button asChild variant="outline">
                            <a href={executionStatus.results.files.notebook.url} download>
                              Download Notebook ({(executionStatus.results.files.notebook.size / 1024 / 1024).toFixed(2)} MB)
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {/* Error */}
                {executionStatus.error && (
                  <Card className="p-6 border-destructive">
                    <h3 className="font-semibold text-lg mb-2 text-destructive">Error</h3>
                    <p className="text-sm">{executionStatus.error}</p>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {isExecuting && (
                    <Button onClick={handleCancel} variant="destructive">
                      Cancel Execution
                    </Button>
                  )}
                  {executionStatus.status === 'failed' && (
                    <Button onClick={handleRetry}>
                      Retry Execution
                    </Button>
                  )}
                  {['complete', 'failed', 'cancelled'].includes(executionStatus.status) && (
                    <Button onClick={handleNewExecution}>
                      New Execution
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
