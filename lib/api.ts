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
            return data
      },

      // Get single class by ID
      getById: async (id: string): Promise<ApiResponse<Class>> => {
            const { data } = await api.get(`/calander/${id}`)
            return data
      },

      // Create a new class (one-time or recurring)
      create: async (classData: CreateClassRequest): Promise<ApiResponse<CreateClassResponse>> => {
            const { data } = await api.post('/calander', classData)
            return data
      },

      // Update a class (PUT for full updates)
      update: async (id: string, classData: UpdateClassRequest): Promise<ApiResponse<Class>> => {
            const { data } = await api.put(`/calander/${id}`, classData)
            return data
      },

      // Update class status (PATCH for status-only updates)
      updateStatus: async (id: string, status: ClassStatus): Promise<ApiResponse<Class>> => {
            const { data } = await api.patch(`/calander/${id}/status`, { status })
            return data
      },

      // Delete a class
      delete: async (id: string): Promise<ApiResponse<null>> => {
            const { data } = await api.delete(`/calander/${id}`)
            return data
      },

      // Get class instances by class ID
      getInstances: async (
            classId: string,
            params?: { page?: number; limit?: number }
      ): Promise<PaginatedResponse<ClassInstance>> => {
            const { data } = await api.get(`/calander/${classId}/instances`, { params })
            return data
      },

      // Regenerate instances for a recurring class
      regenerateInstances: async (classId: string): Promise<ApiResponse<{ instanceCount: number }>> => {
            const { data } = await api.post(`/calander/${classId}/regenerate`)
            return data
      },
}

// ===== Instances API =====
export const instanceApi = {
      // Get all instances in date range
      getByDateRange: async (params: GetInstancesParams): Promise<ApiResponse<ClassInstance[]>> => {
            const { data } = await api.get('/calander/instances', { params })
            return data
      },

      // Update instance status (PATCH for status updates)
      updateStatus: async (
            instanceId: string,
            statusData: UpdateInstanceRequest
      ): Promise<ApiResponse<ClassInstance>> => {
            const { data } = await api.patch(`/calander/instance/${instanceId}`, statusData)
            return data
      },
}

// ===== Calendar API =====
export const calendarApi = {
      // Get calendar view (unified view of all events)
      getCalendarView: async (params: GetCalendarParams): Promise<ApiResponse<CalendarEvent[]>> => {
            const { data } = await api.get('/calander/calendar', { params })
            return data
      },
}

export default api
