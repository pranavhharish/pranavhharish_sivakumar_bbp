import axios, { AxiosInstance } from 'axios';
import {
  UploadResponse,
  RunsListResponse,
  RunWithData,
} from '@/types';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Upload CSV file and get processing results
   */
  async uploadFile(
    file: File,
    pump1: string,
    pump2: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pump1', pump1);
    formData.append('pump2', pump2);

    try {
      const response = await this.instance.post<UploadResponse>(
        '/api/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch time-series data for a specific run
   */
  async getRunData(runId: string): Promise<RunWithData> {
    try {
      const response = await this.instance.get<any>(`/api/runs/${runId}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch run data');
      }
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch list of all runs
   */
  async listRuns(limit: number = 50, offset: number = 0): Promise<RunsListResponse> {
    try {
      const response = await this.instance.get<RunsListResponse>('/api/runs', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and return user-friendly messages
   */
  private handleError(error: any): Error {
    if (error.response) {
      const { data, status } = error.response;
      const message = data?.error || `Server error: ${status}`;
      return new Error(message);
    } else if (error.request) {
      return new Error('No response from server. Please check your connection.');
    } else {
      return error;
    }
  }
}

export const apiClient = new ApiClient();
