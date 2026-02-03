import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classApi, instanceApi, calendarApi, healthApi } from '@/lib/api'
import type {
      CreateClassRequest,
      UpdateClassRequest,
      UpdateInstanceRequest,
      GetClassesParams,
      GetInstancesParams,
      GetCalendarParams,
      ClassStatus,
} from '@/types/calendar'

// Query keys
export const queryKeys = {
      health: ['health'] as const,
      classes: ['classes'] as const,
      class: (id: string) => ['class', id] as const,
      classInstances: (id: string) => ['classInstances', id] as const,
      instances: (startDate: string, endDate: string) =>
            ['instances', startDate, endDate] as const,
      calendar: (startDate: string, endDate: string) =>
            ['calendar', startDate, endDate] as const,
}

// Health check hook
export function useHealthCheck() {
      return useQuery({
            queryKey: queryKeys.health,
            queryFn: () => healthApi.check(),
            retry: 1,
            refetchInterval: 30000,
      })
}

// Classes hooks
export function useClasses(params?: GetClassesParams) {
      return useQuery({
            queryKey: [...queryKeys.classes, params],
            queryFn: () => classApi.getAll(params),
            staleTime: 30000, // Consider data stale after 30 seconds
            refetchOnWindowFocus: true,
      })
}

export function useClass(id: string) {
      return useQuery({
            queryKey: queryKeys.class(id),
            queryFn: () => classApi.getById(id),
            enabled: !!id,
      })
}

export function useCreateClass() {
      const queryClient = useQueryClient()

      return useMutation({
            mutationFn: async (data: CreateClassRequest) => {
                  console.log('[useCreateClass] Sending request:', data)
                  const response = await classApi.create(data)
                  console.log('[useCreateClass] Response:', response)
                  return response
            },
            onSuccess: () => {
                  // Invalidate all related queries
                  queryClient.invalidateQueries({ queryKey: queryKeys.classes })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
                  queryClient.invalidateQueries({ queryKey: ['instances'] })
            },
            onError: (error: any) => {
                  console.error('[useCreateClass] Error:', error.response?.data || error.message)
            },
      })
}

export function useUpdateClass() {
      const queryClient = useQueryClient()

      return useMutation({
            mutationFn: ({ id, data }: { id: string; data: UpdateClassRequest }) =>
                  classApi.update(id, data),
            onSuccess: (_, variables) => {
                  queryClient.invalidateQueries({ queryKey: queryKeys.classes })
                  queryClient.invalidateQueries({ queryKey: queryKeys.class(variables.id) })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
            },
      })
}

export function useDeleteClass() {
      const queryClient = useQueryClient()

      return useMutation({
            mutationFn: (id: string) => classApi.delete(id),
            onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: queryKeys.classes })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
                  queryClient.invalidateQueries({ queryKey: ['instances'] })
            },
      })
}

export function useClassInstances(
      classId: string,
      params?: { page?: number; limit?: number }
) {
      return useQuery({
            queryKey: [...queryKeys.classInstances(classId), params],
            queryFn: () => classApi.getInstances(classId, params),
            enabled: !!classId,
      })
}

export function useRegenerateInstances() {
      const queryClient = useQueryClient()

      return useMutation({
            mutationFn: (classId: string) => classApi.regenerateInstances(classId),
            onSuccess: (_, classId) => {
                  queryClient.invalidateQueries({ queryKey: queryKeys.classInstances(classId) })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
                  queryClient.invalidateQueries({ queryKey: ['instances'] })
            },
      })
}

// Instances hooks
export function useInstances(params: GetInstancesParams) {
      return useQuery({
            queryKey: queryKeys.instances(params.startDate, params.endDate),
            queryFn: () => instanceApi.getByDateRange(params),
            enabled: !!params.startDate && !!params.endDate,
            staleTime: 30000,
      })
}

// Update class status (for both one-time and recurring classes)
export function useUpdateClassStatus() {
      const queryClient = useQueryClient()

      return useMutation({
            mutationFn: async ({
                  classId,
                  status,
            }: {
                  classId: string
                  status: ClassStatus
            }) => {
                  console.log('[useUpdateClassStatus] Updating:', { classId, status })
                  const response = await classApi.updateStatus(classId, status)
                  console.log('[useUpdateClassStatus] Response:', response)
                  return response
            },
            onSuccess: (_, variables) => {
                  // Invalidate all related queries
                  queryClient.invalidateQueries({ queryKey: queryKeys.classes })
                  queryClient.invalidateQueries({ queryKey: queryKeys.class(variables.classId) })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
                  queryClient.invalidateQueries({ queryKey: ['instances'] })
                  queryClient.invalidateQueries({ queryKey: ['classInstances'] })
            },
            onError: (error: any) => {
                  console.error('[useUpdateClassStatus] Error:', error.response?.data || error.message)
            },
      })
}

// Update instance status (for recurring class instances only)
export function useUpdateInstanceStatus() {
      const queryClient = useQueryClient()

      return useMutation({
            mutationFn: async ({
                  instanceId,
                  data,
            }: {
                  instanceId: string
                  data: UpdateInstanceRequest
            }) => {
                  console.log('[useUpdateInstanceStatus] Updating:', { instanceId, data })
                  const response = await instanceApi.updateStatus(instanceId, data)
                  console.log('[useUpdateInstanceStatus] Response:', response)
                  return response
            },
            onSuccess: () => {
                  // Invalidate all instance-related queries
                  queryClient.invalidateQueries({ queryKey: ['instances'] })
                  queryClient.invalidateQueries({ queryKey: ['calendar'] })
                  queryClient.invalidateQueries({ queryKey: ['classInstances'] })
                  queryClient.invalidateQueries({ queryKey: queryKeys.classes })
            },
            onError: (error: any) => {
                  console.error('[useUpdateInstanceStatus] Error:', error.response?.data || error.message)
            },
      })
}

// Calendar hooks
export function useCalendarView(params: GetCalendarParams) {
      return useQuery({
            queryKey: [...queryKeys.calendar(params.startDate, params.endDate), params.status],
            queryFn: async () => {
                  console.log('[useCalendarView] Fetching:', params)
                  const response = await calendarApi.getCalendarView(params)
                  console.log('[useCalendarView] Response:', response)
                  return response
            },
            enabled: !!params.startDate && !!params.endDate,
            staleTime: 30000,
            refetchOnWindowFocus: true,
      })
}
