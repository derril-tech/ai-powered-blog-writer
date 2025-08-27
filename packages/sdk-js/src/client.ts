import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  Post,
  CreatePostRequest,
  UpdatePostRequest,
  Outline,
  Draft,
  QaCheck,
  Publish,
  Analytics,
  SdkConfig,
} from './types';

export class AiBlogWriterClient {
  private client: AxiosInstance;

  constructor(config: SdkConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Posts API
  async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    const response = await this.client.post('/v1/posts', data);
    return response.data;
  }

  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Post>>> {
    const response = await this.client.get('/v1/posts', { params });
    return response.data;
  }

  async getPost(id: string): Promise<ApiResponse<Post>> {
    const response = await this.client.get(`/v1/posts/${id}`);
    return response.data;
  }

  async updatePost(id: string, data: UpdatePostRequest): Promise<ApiResponse<Post>> {
    const response = await this.client.put(`/v1/posts/${id}`, data);
    return response.data;
  }

  async deletePost(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/v1/posts/${id}`);
    return response.data;
  }

  // Outline API
  async generateOutline(postId: string): Promise<ApiResponse<Outline>> {
    const response = await this.client.post(`/v1/posts/${postId}/outline`);
    return response.data;
  }

  async getOutline(postId: string): Promise<ApiResponse<Outline>> {
    const response = await this.client.get(`/v1/posts/${postId}/outline`);
    return response.data;
  }

  // Draft API
  async generateDraft(postId: string): Promise<ApiResponse<Draft>> {
    const response = await this.client.post(`/v1/posts/${postId}/draft`);
    return response.data;
  }

  async getDraft(postId: string): Promise<ApiResponse<Draft>> {
    const response = await this.client.get(`/v1/posts/${postId}/draft`);
    return response.data;
  }

  // QA API
  async runQaChecks(postId: string): Promise<ApiResponse<QaCheck[]>> {
    const response = await this.client.post(`/v1/posts/${postId}/qa`);
    return response.data;
  }

  async getQaChecks(postId: string): Promise<ApiResponse<QaCheck[]>> {
    const response = await this.client.get(`/v1/posts/${postId}/qa`);
    return response.data;
  }

  // Publish API
  async publishPost(postId: string, siteId: string): Promise<ApiResponse<Publish>> {
    const response = await this.client.post(`/v1/posts/${postId}/publish`, { siteId });
    return response.data;
  }

  async getPublish(publishId: string): Promise<ApiResponse<Publish>> {
    const response = await this.client.get(`/v1/publishes/${publishId}`);
    return response.data;
  }

  // Analytics API
  async getAnalytics(postId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Analytics[]>> {
    const response = await this.client.get(`/v1/posts/${postId}/analytics`, { params });
    return response.data;
  }

  async refreshAnalytics(): Promise<ApiResponse<void>> {
    const response = await this.client.post('/v1/analytics/refresh');
    return response.data;
  }

  // Utility methods
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    const response = await this.client.get('/v1/health');
    return response.data;
  }

  // Helper method for custom requests
  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request(config);
    return response.data;
  }
}

// Factory function for easy instantiation
export function createClient(config: SdkConfig): AiBlogWriterClient {
  return new AiBlogWriterClient(config);
}

// Default export
export default AiBlogWriterClient;
