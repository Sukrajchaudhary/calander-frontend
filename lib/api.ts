import axios from 'axios'
import type {
      Class,
      ClassInstance,
      CalendarEvent,
      CreateClassRequest,
      UpdateClassRequest,
      UpdateInstanceRequest,
      ApiResponse,
      PaginatedResponse,
      CreateClassResponse,
      GetClassesParams,
      GetInstancesParams,
      GetCalendarParams,
      ClassStatus,
} from '@/types/calendar'

// Create axios instance with base URL
const api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
      headers: {
            'Content-Type': 'application/json',
      },
})

// Request interceptor for debugging
api.interceptors.request.use(
      (config) => {
            console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params)
            return config
      },
      (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
      (response) => response,
      (error) => {
            console.error('[API Error]', error.response?.data || error.message)
            return Promise.reject(error)
      }
)

// Transform backend response to frontend expected format
function transformBackendResponse<T>(response: any): ApiResponse<T> {
      // If the response already has 'success' field, return as-is
      if (response.success !== undefined) {
            return response
      }
      // Otherwise, transform from backend format
      return {
            success: true,
            message: response.message,
            data: response.data
      }
}

// Transform paginated backend response to frontend expected format
function transformPaginatedResponse<T>(response: any): PaginatedResponse<T> {
      // If the response already has 'success' field, return as-is
      if (response.success !== undefined) {
            return response
      }
      // Otherwise, transform from backend format
      return {
            success: true,
            data: response.data || [],
            pagination: response.pagination || {
                  page: 1,
                  limit: 10,
                  total: 0,
                  totalPages: 0
            }
      }
}

// ===== Health Check =====
export const healthApi = {
      check: async (): Promise<{ status: string }> => {
            const { data } = await api.get('/health')
            return data
      },
}

// ===== Classes API =====
export const classApi = {
      // Get all classes with pagination, filters, and search
      getAll: async (params?: GetClassesParams): Promise<PaginatedResponse<Class>> => {
            const { data } = await api.get('/calander', { params })
            console.log('[classApi.getAll] Raw response:', data)
            const transformed = transformPaginatedResponse<Class>(data)
            console.log('[classApi.getAll] Transformed response:', transformed)
            return transformed
      },

      // Get single class by ID
      getById: async (id: string): Promise<ApiResponse<Class>> => {
            const { data } = await api.get(`/calander/${id}`)
            return transformBackendResponse<Class>(data)
      },

      // Create a new class (one-time or recurring)
      create: async (classData: CreateClassRequest): Promise<ApiResponse<CreateClassResponse>> => {
            const { data } = await api.post('/calander', classData)
            return transformBackendResponse<CreateClassResponse>(data)
      },

      // Update a class (PUT for full updates)
      update: async (id: string, classData: UpdateClassRequest): Promise<ApiResponse<Class>> => {
            const { data } = await api.put(`/calander/${id}`, classData)
            return transformBackendResponse<Class>(data)
      },

      // Update class status (PATCH for status-only updates)
      updateStatus: async (id: string, status: ClassStatus): Promise<ApiResponse<Class>> => {
            const { data } = await api.patch(`/calander/${id}/status`, { status })
            return transformBackendResponse<Class>(data)
      },

      // Delete a class
      delete: async (id: string): Promise<ApiResponse<null>> => {
            const { data } = await api.delete(`/calander/${id}`)
            return transformBackendResponse<null>(data)
      },

      // Get class instances by class ID
      getInstances: async (
            classId: string,
            params?: { page?: number; limit?: number }
      ): Promise<PaginatedResponse<ClassInstance>> => {
            const { data } = await api.get(`/calander/${classId}/instances`, { params })
            return transformPaginatedResponse<ClassInstance>(data)
      },

      // Regenerate instances for a recurring class
      regenerateInstances: async (classId: string): Promise<ApiResponse<{ instanceCount: number }>> => {
            const { data } = await api.post(`/calander/${classId}/regenerate`)
            return transformBackendResponse<{ instanceCount: number }>(data)
      },

      // Update specific instance by date (PUT)
      updateSpecificInstance: async (
            classId: string,
            scheduledDate: string,
            instanceData: UpdateInstanceRequest,
            startTime?: string
      ): Promise<ApiResponse<ClassInstance>> => {
            const params: any = { scheduledDate };
            if (startTime) {
                  params.startTime = startTime;
            }
            const { data } = await api.put(`/calander/${classId}/instances/specific`, instanceData, { params })
            return transformBackendResponse<ClassInstance>(data)
      },
}

// ===== Instances API =====
export const instanceApi = {
      // Get all instances in date range
      getByDateRange: async (params: GetInstancesParams): Promise<ApiResponse<ClassInstance[]>> => {
            const { data } = await api.get('/calander/instances', { params })
            return transformBackendResponse<ClassInstance[]>(data)
      },

      // Update instance status (PATCH for status updates)
      updateStatus: async (
            instanceId: string,
            statusData: UpdateInstanceRequest
      ): Promise<ApiResponse<ClassInstance>> => {
            const { data } = await api.patch(`/calander/${instanceId}/status`, statusData)
            return transformBackendResponse<ClassInstance>(data)
      },
}

// ===== Calendar API =====
export const calendarApi = {
      // Get calendar view (unified view of all events)
      getCalendarView: async (params: GetCalendarParams): Promise<ApiResponse<CalendarEvent[]>> => {
            const { data } = await api.get('/calander/calendar', { params })
            return transformBackendResponse<CalendarEvent[]>(data)
      },
}

export default api
