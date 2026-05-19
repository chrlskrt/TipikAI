
import axios from "axios";
import { io, Socket } from "socket.io-client";

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // If we get a 401 Unauthorized error, the token is invalid
        if (error.response?.status === 401) {
            // Clear the invalid token
            localStorage.removeItem("access_token");
            
            // Dispatch custom event to notify the UI
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth-change'));
            }
            
            // Redirect to home page to show sign-in button
            // Only redirect if we're not already on the login page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// WebSocket Connection
// ============================================

let socket: Socket | null = null;

/**
 * Create a Socket.IO client connection to the backend
 */
export const createSocketConnection = (): Socket => {
    if (socket && socket.connected) {
        return socket;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    socket = io(apiUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
        console.log('[WebSocket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message);
    });

    return socket;
};

/**
 * Get the current socket instance (or create one if not exists)
 */
export const getSocket = (): Socket => {
    if (!socket) {
        return createSocketConnection();
    }
    return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};


// n8n Client
const n8nClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_N8N_BASE_URL || "http://localhost:5678",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 second timeout
});

// Feature flag to toggle n8n usage
const USE_N8N = process.env.NEXT_PUBLIC_USE_N8N === "true";

// ============================================
// TypeScript Interfaces
// ============================================

export interface ModelResults {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    confusionMatrix?: number[][];
    downloadUrl?: string;
    notebookUrl?: string;
}

// Two-step workflow interfaces
export interface DatasetSearchRequest {
  datasetQuery: string;
  sources?: string[];
}

export interface DatasetSearchResponse {
  message?: string;
  data?: {
    sessionId?: string;
    title: string;
    description: string;
    url: string;
    source: string;
    rows?: number;
    columns?: number;
  };
  // Legacy format support
  sessionId?: string;
  status?: 'completed' | 'failed';
  dataset?: {
    name: string;
    source: string;
    rows: number;
    columns: number;
    description: string;
  };
  error?: string;
}

export interface ModelTrainingRequest {
  sessionId: string;
  modelFormat: string;
}

export interface ModelTrainingResponse {
  workflowId: string;
  status: 'processing' | 'completed' | 'failed';
  results?: ModelResults;
  error?: string;
}

// ============================================
// Model API - Execution-Based Workflow
// ============================================

// Dataset Info (from n8n)
export interface DatasetInfo {
  title: string;
  title_directory: string;
  description: string;
  url: string;
  source: string;
}

// File Info (from Supabase Storage)
export interface FileInfo {
  filename: string;
  path: string;
  url: string;
  size: number;
  expiresAt: string;
}

// Execution Results
export interface ExecutionResults {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: number[][];
  models?: FileInfo[];
  notebooks?: FileInfo[];
  files?: {
    model: FileInfo;
    notebook: FileInfo;
  };
}

// Execution Status Response
export interface ExecutionStatus {
  id: string;
  status: string;
  currentStage?: string;
  progress: number;
  datasetInfo?: DatasetInfo;
  results?: ExecutionResults;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Start Execution Request
export interface StartExecutionRequest {
  modelPrompt: string;
  modelFormat: string;
  sources?: string[];
  chatId?: string;
}

/**
 * Start a new model generation execution
 */
export const startExecution = async (
  request: StartExecutionRequest
): Promise<ExecutionStatus> => {
  try {
    const response = await apiClient.post<ExecutionStatus>('/model/execute', request);
    console.log('Execution started:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to start execution:', error);
    throw error;
  }
};

/**
 * Get execution status by ID
 */
export const getExecutionStatus = async (
  executionId: string
): Promise<ExecutionStatus> => {
  try {
    const response = await apiClient.get<ExecutionStatus>(`/model/execution/${executionId}`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to get execution status:', error.message);
    throw error;
  }
};

/**
 * Get executions by chat ID (for loading chat history)
 */
export const getExecutionsByChatId = async (
  chatId: string
): Promise<ExecutionStatus[]> => {
  try {
    const response = await apiClient.get<ExecutionStatus[]>(`/model/executions/chat/${chatId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get executions for chat:', error);
    throw error;
  }
};

/**
 * Cancel a running execution (graceful stop)
 */
export const cancelExecution = async (executionId: string): Promise<ExecutionStatus> => {
  try {
    const response = await apiClient.post<ExecutionStatus>(`/model/execution/${executionId}/cancel`);
    console.log('Execution cancelled:', executionId);
    return response.data;
  } catch (error) {
    console.error('Failed to cancel execution:', error);
    throw error;
  }
};

/**
 * Retry a failed execution
 */
export const retryExecution = async (executionId: string): Promise<ExecutionStatus> => {
  try {
    const response = await apiClient.post<ExecutionStatus>(`/model/execution/${executionId}/retry`);
    console.log('Execution retried:', executionId);
    return response.data;
  } catch (error) {
    console.error('Failed to retry execution:', error);
    throw error;
  }
};

// ============================================
// Chat API
// ============================================

export interface Chat {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateChatRequest {
  title?: string;
}

export interface CreateChatResponse {
  message: string;
  data: Chat;
}

export interface GetChatsResponse {
  message: string;
  data: Chat[];
}

// Create a new chat
export const createChat = async (title?: string): Promise<Chat> => {
  const response = await apiClient.post<CreateChatResponse>('/chat', {
    title,
  });
  return response.data.data;
};

// Get all chats for the current user
export const getChats = async (): Promise<Chat[]> => {
  const response = await apiClient.get<GetChatsResponse>('/chat');
  return response.data.data;
};

// Get a specific chat
export const getChat = async (chatId: string): Promise<Chat> => {
  const response = await apiClient.get<CreateChatResponse>(`/chat/${chatId}`);
  return response.data.data;
};

// Update chat title
export const updateChatTitle = async (chatId: string, title: string): Promise<Chat> => {
  const response = await apiClient.patch<CreateChatResponse>(`/chat/${chatId}/title`, {
    title,
  });
  return response.data.data;
};

// Delete a chat
export const deleteChat = async (chatId: string): Promise<void> => {
  await apiClient.delete(`/chat/${chatId}`);
};

// Message interfaces
export interface Message {
  id: string;
  chat_id: string;
  is_user: boolean;
  content: any; // JSONB - can be text or structured data
  created_at: string;
}

export interface GetMessagesResponse {
  message: string;
  data: Message[];
}

export interface CreateMessageResponse {
  message: string;
  data: Message;
}

// Get messages for a chat
export const getMessages = async (chatId: string): Promise<Message[]> => {
  const response = await apiClient.get<GetMessagesResponse>(`/chat/${chatId}/message`);
  return response.data.data;
};

// Save a new message to a chat
export const saveMessage = async (chatId: string, isUser: boolean, content: any, userId?: string): Promise<Message> => {
  const messagePreview = typeof content === 'string' ? content.substring(0, 50) : 'object';
  console.log(`[API] Saving ${isUser ? 'user' : 'bot'} message for chat ${chatId}:`, { preview: messagePreview, userId });
  
  try {
    const response = await apiClient.post<CreateMessageResponse>(`/chat/${chatId}/message`, {
      isUser,
      content,
      userId,
    });
    console.log(`[API] Message saved successfully. ID: ${response.data.data.id}`);
    return response.data.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[API] Failed to save message (Status: ${status}):`, {
      chatId,
      error: error.message,
      details: errorData || 'No response data'
    });
    throw error;
  }
};

// ============================================
// Auth API
// ============================================

export const login = async (data: any) => {
    return apiClient.post('/auth/login', data).then(res => res.data);
};

export const register = async (data: any) => {
    return apiClient.post('/auth/register', data).then(res => res.data);
};

export default apiClient;
