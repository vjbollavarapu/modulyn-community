/**
 * Enhanced API client with Axios and React Query integration
 * Provides typed API calls for all backend endpoints
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from '@/components/ui/enhanced-notifications';

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  count?: number;
  next?: string;
  previous?: string;
  results?: T[];
}

export interface ApiError {
  message: string;
  status: number;
  details?: any;
  field_errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: number;
  user: number;
  phone?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access?: string;
  refresh?: string;
  user?: User;
  mfa_required?: boolean;
  email?: string;
  message?: string;
}

export interface MFASetupResponse {
  secret: string;
  qr_code: string;
  provisioning_uri: string;
  message: string;
}

export interface MFAStatus {
  mfa_enabled: boolean;
  mfa_verified: boolean;
  backup_codes_count: number;
  last_used: string | null;
}

export interface MFAVerifyRequest {
  email: string;
  token?: string;
  backup_code?: string;
}

export interface BackupCodesResponse {
  backup_codes: string[];
  warning: string;
}

export interface RefreshTokenResponse {
  access: string;
}

// Inventory Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category: number;
  category_name?: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product: number;
  product_name?: string;
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reference_number?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  supplier: number;
  supplier_name?: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Finance Types
export interface Invoice {
  id: number;
  invoice_number: string;
  customer: number;
  customer_name?: string;
  issue_date: string;
  due_date: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice: number;
  product?: number;
  product_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  invoice: number;
  invoice_number?: string;
  amount: number;
  payment_date: string;
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER';
  reference_number?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  vendor?: string;
  receipt?: string;
  is_billable: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// HR Types (placeholder - to be implemented)
export interface Employee {
  id: number;
  user: number;
  user_name?: string;
  employee_id: string;
  department?: string;
  position?: string;
  hire_date: string;
  salary?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API Client Class
class ApiClient {
  private axiosInstance: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            if (newAccessToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        const apiError = this.handleError(error);
        if (apiError.status >= 500) {
          toast.error('Server Error', 'Something went wrong. Please try again later.');
        } else if (apiError.status === 404) {
          toast.error('Not Found', 'The requested resource was not found.');
        } else if (apiError.status === 403) {
          toast.error('Access Denied', 'You do not have permission to perform this action.');
        }

        return Promise.reject(apiError);
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response;
    const data = response?.data as any;

    return {
      message: data?.message || data?.detail || error.message || 'An error occurred',
      status: response?.status || 0,
      details: data,
      field_errors: data?.field_errors || data?.errors,
    };
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.refreshTokenPromise = this.axiosInstance
      .post<RefreshTokenResponse>('/auth/token/refresh/', { refresh: refreshToken })
      .then((response) => {
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        this.refreshTokenPromise = null;
        return access;
      })
      .catch((error) => {
        this.refreshTokenPromise = null;
        this.clearTokens();
        throw error;
      });

    return this.refreshTokenPromise;
  }

  // Generic HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<T>(url, config);
    return {
      data: response.data,
      status: response.status,
    };
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
    };
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
    };
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return {
      data: response.data,
      status: response.status,
    };
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return {
      data: response.data,
      status: response.status,
    };
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/auth/login/', credentials);
    // Only set tokens if MFA is not required
    if (!response.data.mfa_required && response.data.access && response.data.refresh) {
      this.setTokens(response.data.access, response.data.refresh);
    }
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      await this.post('/auth/logout/');
    } finally {
      this.clearTokens();
    }
    return { data: undefined, status: 200 };
  }

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.post<RefreshTokenResponse>('/auth/token/refresh/', { refresh: refreshToken });
  }

  // User management
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get<User>('/users/profile/');
  }

  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.patch<UserProfile>('/users/profile/', data);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  User,
  UserProfile,
  LoginCredentials,
  LoginResponse,
  Product,
  ProductCategory,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  Invoice,
  InvoiceItem,
  Customer,
  Payment,
  Expense,
  Employee,
};

export default apiClient;
