
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
import { createChat, startExecution, getExecutionStatus, cancelExecution, retryExecution, getSocket, disconnectSocket, type ExecutionStatus } from "@/lib/api";
import { Wand2, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface WizardContainerProps {
  loadedChatId?: string;
  loadedChatTitle?: string;
  loadedExecutionId?: string;
}

export function WizardContainer({ loadedChatId, loadedChatTitle, loadedExecutionId }: WizardContainerProps = {}) {
  const [modelPrompt, setModelPrompt] = React.useState(loadedChatTitle || "");
  const [modelFormat, setModelFormat] = React.useState("keras");
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(loadedChatId || null);
  const [executionId, setExecutionId] = React.useState<string | null>(loadedExecutionId || null);
  const [executionStatus, setExecutionStatus] = React.useState<ExecutionStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingExecution, setIsLoadingExecution] = React.useState(false);
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  const [errorModalOpen, setErrorModalOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

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

  // WebSocket connection for real-time updates
  React.useEffect(() => {
    if (!executionId) return;

    const socket = getSocket();

    // Join the execution room
    socket.emit('join-execution', executionId);
    console.log('[WebSocket] Joined execution room:', executionId);

    // Listen for real-time execution updates
    const handleExecutionUpdate = (data: ExecutionStatus) => {
      console.log('[WebSocket] Received update:', data);
      setExecutionStatus(data);
      // Close error modal if it's open, since we're receiving updates
      setErrorModalOpen(false);
    };

    socket.on('execution-update', handleExecutionUpdate);

    // Cleanup on unmount or when executionId changes
    return () => {
      socket.off('execution-update', handleExecutionUpdate);
      socket.emit('leave-execution', executionId);
      console.log('[WebSocket] Left execution room:', executionId);
    };
  }, [executionId]);

  // Disconnect socket when component unmounts
  React.useEffect(() => {
    return () => {
      // Only disconnect if there's no active execution
      if (!executionId || ['complete', 'failed', 'cancelled'].includes(executionStatus?.status || '')) {
        disconnectSocket();
      }
    };
  }, []);

  // Smooth progress animation - increment gradually between polls
  React.useEffect(() => {
    if (!executionStatus || ['complete', 'failed', 'cancelled'].includes(executionStatus.status)) {
      return;
    }

    const targetProgress = executionStatus.progress || 0;
    setAnimatedProgress(targetProgress);

    // Gradually increment progress every second
    const progressInterval = setInterval(() => {
      setAnimatedProgress(prev => {
        const nextTarget = executionStatus.progress || 0;
        // Don't exceed the actual progress from server
        if (prev >= nextTarget) return prev;
        // Increment by small amount (max 1% per second)
        return Math.min(prev + 0.5, nextTarget);
      });
    }, 1000); // Update every second

    return () => clearInterval(progressInterval);
  }, [executionStatus?.progress, executionStatus?.status]);

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
    } catch (error: any) {
      console.error('Failed to start execution:', error);
      setErrorMessage(error?.response?.data?.message || error?.message || 'Failed to start execution');
      setErrorModalOpen(true);
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

  const handleDownload = async (url: string, filename: string) => {
    try {
      // Fetch the file and create a blob
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab if fetch fails (e.g. CORS)
      window.open(url, '_blank');
    }
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
                <span className="flex items-center gap-1">
                  {executionStatus.currentStage || executionStatus.status}
                  {isExecuting && (
                    <span className="inline-flex gap-[2px] ml-1">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-[bounce_1.4s_ease-in-out_0s_infinite]"></span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-[bounce_1.4s_ease-in-out_0.2s_infinite]"></span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full animate-[bounce_1.4s_ease-in-out_0.4s_infinite]"></span>
                    </span>
                  )}
                </span>
                <span>{Math.round(executionStatus.progress)}% Complete</span>
              </div>
              <div className="h-4 bg-primary/15 rounded-full overflow-hidden border border-primary/10">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${animatedProgress}%` }}
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
                  <Select value={modelFormat} onValueChange={setModelFormat} disabled>
                    <SelectTrigger id="modelFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keras">
                        <div className="flex gap-5 items-baseline">
                          <span className="font-medium">Keras (.keras)</span>
                          <span className="text-xs text-muted-foreground">Deep learning, modern Keras 3 format</span>
                        </div>
                      </SelectItem>
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
                    {modelFormat === 'keras' && '💡 Best for deep learning models using modern Keras 3 format'}
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
                {/* Error Display for Failed Executions */}
                {executionStatus.status === 'failed' && (
                  <Card className="p-6 border-destructive bg-destructive/5">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-destructive">Execution Failed</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {executionStatus.error || 'An error occurred during model generation. Please try again.'}
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={handleRetry} variant="destructive" size="sm">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retry
                          </Button>
                          <Button onClick={handleNewExecution} variant="outline" size="sm">
                            Start New
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

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
                    <h3 className="font-semibold text-lg mb-4">Models Generated Successfully!</h3>
                    
                    {(executionStatus.results.models || executionStatus.results.notebooks) && (
                      <div className="space-y-4">
                        {/* Models */}
                        {executionStatus.results.models && executionStatus.results.models.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Models</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {executionStatus.results.models.map((model, index) => (
                                <Button 
                                  key={index} 
                                  className="w-full"
                                  onClick={() => handleDownload(model.url, model.filename)}
                                >
                                  Download Model {index + 1} ({model.filename})
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notebooks */}
                        {executionStatus.results.notebooks && executionStatus.results.notebooks.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Notebooks</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {executionStatus.results.notebooks.map((notebook, index) => (
                                <Button 
                                  key={index} 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => handleDownload(notebook.url, notebook.filename)}
                                >
                                  Download Notebook {index + 1} ({notebook.filename})
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Download links expire on {executionStatus.results.models?.[0]?.expiresAt ? new Date(executionStatus.results.models[0].expiresAt).toLocaleDateString() : 'N/A'}
                        </p>
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

      {/* Error Modal for Submission Failures */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Failed to Start Execution
            </DialogTitle>
            <DialogDescription className="pt-4">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorModalOpen(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
