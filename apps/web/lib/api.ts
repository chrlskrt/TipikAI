
import axios from "axios";

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

export interface Dataset {
  id: string;
  name: string;
  description: string;
  rows: number;
  columns: number;
  source: string;
}

export interface PreprocessingOptions {
    handleMissing: boolean;
    normalize: boolean;
    encodeCategorical: boolean;
}

export interface ModelCreationStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
}

// n8n Request/Response Types

export interface SearchDatasetsRequest {
  query: string;
  sources?: string[];
}

export interface SearchDatasetsResponse {
  datasets: Dataset[];
}

export interface ValidatePreprocessingRequest {
  datasetIds: string[];
  options: PreprocessingOptions;
}

export interface ValidatePreprocessingResponse {
  valid: boolean;
  warnings?: string[];
  suggestions?: string[];
}

export interface ConfigureOutputRequest {
  datasetIds: string[];
  preprocessing: PreprocessingOptions;
  outputType: 'notebook' | 'model';
}

export interface ConfigureOutputResponse {
  configured: boolean;
  estimatedTime?: string;
  message?: string;
}

export interface GenerateModelRequest {
  datasetIds: string[];
  preprocessing: PreprocessingOptions;
  outputType: 'notebook' | 'model';
}

export interface ModelResults {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    confusionMatrix?: number[][];
    downloadUrl?: string;
    notebookUrl?: string;
}

export interface GenerateModelResponse {
  workflowId: string;
  status: 'processing' | 'completed' | 'failed';
  results?: ModelResults;
  error?: string;
}

// ============================================
// Mock Data
// ============================================

const MOCK_DATASETS: Dataset[] = [
    { id: '1', name: 'Titanic Survival', description: 'Predict survival on the Titanic', rows: 891, columns: 12, source: 'Kaggle' },
    { id: '2', name: 'Iris Species', description: 'Classify iris plant species', rows: 150, columns: 5, source: 'UCI Machine Learning Repository' },
    { id: '3', name: 'House Prices', description: 'Predict house prices', rows: 1460, columns: 81, source: 'Kaggle' },
    { id: '4', name: 'Breast Cancer', description: 'Diagnosis of breast cancer', rows: 569, columns: 32, source: 'UCI Machine Learning Repository' },
    { id: '5', name: 'Customer Churn', description: 'Telecom customer churn dataset', rows: 7043, columns: 21, source: 'Kaggle' },
    { id: '6', name: 'Credit Card Fraud', description: 'Fraud detection in transactions', rows: 284807, columns: 31, source: 'Kaggle' },
    { id: '7', name: 'Wine Quality', description: 'Predict wine quality ratings', rows: 1599, columns: 12, source: 'UCI Machine Learning Repository' },
    { id: '8', name: 'Diabetes Prediction', description: 'Predict diabetes occurrence', rows: 768, columns: 9, source: 'Kaggle' },
];

// ============================================
// API Functions
// ============================================

/**
 * Step 1: Search for datasets
 */
export const searchDatasets = async (query: string, sources?: string[]): Promise<Dataset[]> => {
    if (USE_N8N) {
        try {
            const endpoint = process.env.NEXT_PUBLIC_N8N_SEARCH_DATASETS || '/webhook/search-datasets';
            const response = await n8nClient.post<SearchDatasetsResponse>(endpoint, {
                query,
                sources,
            } as SearchDatasetsRequest);
            
            return response.data.datasets;
        } catch (error) {
            console.error('n8n search failed, falling back to mock data:', error);
            // Fallback to mock
        }
    }
    
    // Mock implementation
    console.log(`[MOCK] Searching for datasets: ${query} [${sources?.join(', ')}]`);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_DATASETS.filter(d => {
                const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase()) || 
                                   d.description.toLowerCase().includes(query.toLowerCase());
                const matchesSource = sources && sources.length > 0 ? sources.includes(d.source) : true;
                return matchesQuery && matchesSource;
            }));
        }, 500);
    });
};

/**
 * Step 2: Validate preprocessing options
 */
export const validatePreprocessing = async (
    datasetIds: string[], 
    options: PreprocessingOptions
): Promise<ValidatePreprocessingResponse> => {
    if (USE_N8N) {
        try {
            const endpoint = process.env.NEXT_PUBLIC_N8N_VALIDATE_PREPROCESSING || '/webhook/validate-preprocessing';
            const response = await n8nClient.post<ValidatePreprocessingResponse>(endpoint, {
                datasetIds,
                options,
            } as ValidatePreprocessingRequest);
            
            return response.data;
        } catch (error) {
            console.error('n8n validation failed, falling back to mock:', error);
            // Fallback to mock
        }
    }
    
    // Mock implementation
    console.log('[MOCK] Validating preprocessing:', { datasetIds, options });
    return new Promise((resolve) => {
        setTimeout(() => {
            const warnings: string[] = [];
            if (!options.handleMissing) {
                warnings.push('Missing values may affect model performance');
            }
            if (!options.normalize) {
                warnings.push('Unnormalized features may cause convergence issues');
            }
            
            resolve({
                valid: true,
                warnings: warnings.length > 0 ? warnings : undefined,
                suggestions: ['Consider enabling all preprocessing options for best results'],
            });
        }, 300);
    });
};

/**
 * Step 3: Configure output format
 */
export const configureOutput = async (
    datasetIds: string[],
    preprocessing: PreprocessingOptions,
    outputType: 'notebook' | 'model'
): Promise<ConfigureOutputResponse> => {
    if (USE_N8N) {
        try {
            const endpoint = process.env.NEXT_PUBLIC_N8N_CONFIGURE_OUTPUT || '/webhook/configure-output';
            const response = await n8nClient.post<ConfigureOutputResponse>(endpoint, {
                datasetIds,
                preprocessing,
                outputType,
            } as ConfigureOutputRequest);
            
            return response.data;
        } catch (error) {
            console.error('n8n configuration failed, falling back to mock:', error);
            // Fallback to mock
        }
    }
    
    // Mock implementation
    console.log('[MOCK] Configuring output:', { datasetIds, preprocessing, outputType });
    return new Promise((resolve) => {
        setTimeout(() => {
            const estimatedTime = outputType === 'notebook' ? '2-3 minutes' : '5-10 minutes';
            resolve({
                configured: true,
                estimatedTime,
                message: `Your ${outputType} will be ready in approximately ${estimatedTime}`,
            });
        }, 300);
    });
};

/**
 * Step 4: Generate model and get results
 */
export const generateModel = async (
    datasetIds: string[],
    preprocessing: PreprocessingOptions,
    outputType: 'notebook' | 'model'
): Promise<GenerateModelResponse> => {
    if (USE_N8N) {
        try {
            const endpoint = process.env.NEXT_PUBLIC_N8N_GENERATE_MODEL || '/webhook/generate-model';
            const response = await n8nClient.post<GenerateModelResponse>(endpoint, {
                datasetIds,
                preprocessing,
                outputType,
            } as GenerateModelRequest);
            
            return response.data;
        } catch (error) {
            console.error('n8n generation failed, falling back to mock:', error);
            // Fallback to mock
        }
    }
    
    // Mock implementation
    console.log('[MOCK] Generating model:', { datasetIds, preprocessing, outputType });
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate model results
            const mockResults: ModelResults = {
                accuracy: 0.92,
                precision: 0.89,
                recall: 0.91,
                f1Score: 0.90,
                confusionMatrix: [[85, 15], [12, 88]],
                downloadUrl: outputType === 'notebook' 
                    ? '/downloads/model-notebook.ipynb' 
                    : '/downloads/model.pkl',
                notebookUrl: outputType === 'notebook' ? '/downloads/model-notebook.ipynb' : undefined,
            };
            
            resolve({
                workflowId: `workflow-${Date.now()}`,
                status: 'completed',
                results: mockResults,
            });
        }, 2000); // Simulate 2 second processing
    });
};

// Legacy function - kept for backwards compatibility
export const startModelGeneration = generateModel;

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
