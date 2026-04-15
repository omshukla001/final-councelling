import axios from 'axios';
import { auth } from '@/lib/firebase';

// Uses Vite proxy in dev (/api → localhost:8000), or a custom URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Interceptors ─────────────────────────────────────────────────────────────

api.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (error) {
        console.warn('[API] Error fetching Firebase token:', error);
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 429) {
            console.warn('[API] Rate limited — please slow down.');
        } else if (status >= 500) {
            console.error(`[API] Server error (${status}):`, error.response?.data?.detail || error.message);
        }
        return Promise.reject(error);
    }
);

// ── TypeScript Interfaces ────────────────────────────────────────────────────

export interface College {
    college_id: number;
    name: string;
    state: string;
    nirf_rank?: number;
    type?: string;
}

export interface CollegeListResponse {
    colleges: College[];
    total: number;
    page: number;
    page_size: number;
}

export interface FiltersResponse {
    categories: string[];
    branches: string[];
    quotas: string[];
    genders: string[];
    examBranches?: Record<string, string[]>;
}

export interface RecommendationRequest {
    rank: number;
    exam?: string;
    category: string;
    quota: string | string[];
    gender?: string;
    counselling_type?: string;
    preferred_branches?: string[];
    limit?: number;
    firebase_uid?: string;
}

export interface RecommendationResponse {
    recommendations: Record<string, unknown>[];
    safe_count: number;
    target_count: number;
    dream_count: number;
    explanation: string;
}

export interface CollegeDetailResponse {
    college_id: string;
    name: string;
    state: string;
    type: string;
    nirf_rank: number | null;
    nirf_display: string | null;
    scraped_data: Record<string, unknown>;
    branches: Array<{
        name: string;
        total_entries: number;
        cutoff_trend: Array<{ year: number; round: number; closing_rank: number; opening_rank: number }>;
    }>;
    branch_count: number;
    available_years: number[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    answer: string;
    latency_ms?: number;
    options?: string[];
}

// ── Service Objects ──────────────────────────────────────────────────────────

export const CollegeService = {
    getColleges: async (params?: {
        search?: string;
        type?: string;
        page?: number;
        page_size?: number;
    }): Promise<CollegeListResponse> => {
        const response = await api.get('/recommendation-service/college/list', { params });
        return response.data;
    },

    getFilters: async (): Promise<FiltersResponse> => {
        const response = await api.get('/recommendation-service/college/filters');
        return response.data;
    },

    getCollege: async (id: string | number): Promise<CollegeDetailResponse> => {
        const response = await api.get(`/recommendation-service/college/${id}`);
        return response.data;
    },

    getRecommendations: async (data: RecommendationRequest): Promise<RecommendationResponse> => {
        const response = await api.post('/recommendation-service/recommendations', {
            ...data,
            counselling_type: data.counselling_type || 'JOSAA'
        });
        return response.data;
    },

    predictRank: async (percentile: number, totalCandidates: number): Promise<{ predicted_rank: number }> => {
        const response = await api.get('/rank-service/predict', {
            params: { percentile, total_candidates: totalCandidates }
        });
        return response.data;
    },

    getPlacementData: async (collegeId: string | number): Promise<Record<string, unknown>> => {
        const response = await api.get(`/placement-data/${collegeId}`);
        return response.data;
    }
};

export const ChatService = {
    sendMessage: async (
        question: string,
        counsellingType: string = 'JOSAA',
        examType: string = 'JEE Main',
        chatHistory?: ChatMessage[],
        firebaseUid?: string
    ): Promise<ChatResponse> => {
        const response = await api.post('/ai-chat/chat', {
            question,
            counselling_type: counsellingType,
            exam_type: examType,
            ...(chatHistory && { chat_history: chatHistory }),
            ...(firebaseUid && { firebase_uid: firebaseUid }),
        });
        return response.data;
    }
};

export default api;
