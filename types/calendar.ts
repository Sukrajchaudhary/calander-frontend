// ===== Recurrence Types =====
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom'

export type DayOfWeek =
      | 'sunday'
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'

export interface TimeSlot {
      startTime: string  // HH:mm format
      endTime: string    // HH:mm format
}

// Recurrence configuration based on API structure
export interface DailyRecurrence {
      type: 'daily'
      startDate: string  // ISO date string
      endDate?: string   // ISO date string
      dailyTimeSlots: TimeSlot[]
}

export interface WeeklyRecurrence {
      type: 'weekly'
      startDate: string
      endDate?: string
      weeklyDays: DayOfWeek[]
      weeklyTimeSlots: TimeSlot[]
}

export interface MonthlyRecurrence {
      type: 'monthly'
      startDate: string
      endDate?: string
      monthlyDays: number[]  // Day of month (1-31)
      monthlyTimeSlots: TimeSlot[]
}

export interface CustomRecurrence {
      type: 'custom'
      startDate: string
      endDate?: string
      customDays: DayOfWeek[]
      customInterval: number  // Every N weeks
      customTimeSlots: TimeSlot[]
}

export type RecurrenceConfig = DailyRecurrence | WeeklyRecurrence | MonthlyRecurrence | CustomRecurrence

// ===== Status Types =====
export type ClassStatus = 'active' | 'cancelled' | 'completed'
export type InstanceStatus = 'scheduled' | 'cancelled' | 'completed'

// ===== Core Entities =====
export interface Class {
      _id: string
      title: string
      description?: string
      instructor?: string
      location?: string
      capacity?: number
      isRecurring: boolean
      status: ClassStatus
      // One-time class fields
      scheduledDate?: string
      startTime?: string
      endTime?: string
      // Recurring class fields
      recurrence?: RecurrenceConfig
      createdAt: string
      updatedAt: string
}

export interface ClassInstance {
      _id: string
      classId: string | Class
      scheduledDate: string
      startTime: string
      endTime: string
      status: InstanceStatus
      bookedCount?: number
      attendedCount?: number
      noShowCount?: number
      createdAt: string
      updatedAt: string
}

// Calendar view event (combined view of classes and instances)
export interface CalendarEvent {
      id: string
      classId: string
      type: 'one-time' | 'recurring-instance'
      title: string
      description?: string
      instructor?: string
      location?: string
      capacity?: number
      bookedCount?: number
      scheduledDate: string
      startTime: string
      endTime: string
      status: InstanceStatus | ClassStatus
      isRecurring: boolean
      recurrence?: RecurrenceConfig
}

// ===== API Request Types =====

// Create One-Time Class Request
export interface CreateOneTimeClassRequest {
      title: string
      description?: string
      instructor?: string
      location?: string
      capacity?: number
      isRecurring: false
      scheduledDate: string
      startTime: string
      endTime: string
}

// Create Recurring Class Request
export interface CreateRecurringClassRequest {
      title: string
      description?: string
      instructor?: string
      location?: string
      capacity?: number
      isRecurring: true
      recurrence: RecurrenceConfig
}

export type CreateClassRequest = CreateOneTimeClassRequest | CreateRecurringClassRequest

export interface UpdateClassRequest {
      title?: string
      description?: string
      instructor?: string
      location?: string
      capacity?: number
      status?: ClassStatus
}

export interface UpdateInstanceRequest {
      status: InstanceStatus
}

// ===== API Response Types =====
export interface ApiResponse<T> {
      success: boolean
      message?: string
      data: T
}

export interface PaginatedResponse<T> {
      success: boolean
      data: T[]
      pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
      }
}

export interface CreateClassResponse {
      class: Class
      instances?: ClassInstance[]
      instanceCount?: number
}

export interface ApiError {
      success: false
      message: string
      errors?: { field: string; message: string }[]
}

// ===== UI State Types =====
export type ViewMode = 'calendar' | 'list'
export type DateViewMode = 'day' | 'week' | 'month'
export type EventFilter = 'all' | 'scheduled' | 'completed' | 'cancelled'

// Form state for create/edit modal
export interface CreateClassFormState {
      title: string
      description: string
      instructor: string
      location: string
      capacity: number
      isRecurring: boolean
      // One-time fields
      scheduledDate: Date | undefined
      startTime: string
      endTime: string
      // Recurring fields
      recurrenceType: RecurrenceType
      recurrenceStartDate: Date | undefined
      recurrenceEndDate: Date | undefined
      // Daily
      dailyTimeSlots: TimeSlot[]
      // Weekly
      weeklyDays: DayOfWeek[]
      weeklyTimeSlots: TimeSlot[]
      // Monthly
      monthlyDays: number[]
      monthlyTimeSlots: TimeSlot[]
      // Custom
      customDays: DayOfWeek[]
      customInterval: number
      customTimeSlots: TimeSlot[]
}

// ===== Query Parameters =====
export interface GetClassesParams {
      page?: number
      limit?: number
      status?: ClassStatus
      isRecurring?: boolean
      startDate?: string
      endDate?: string
      search?: string
}

export interface GetInstancesParams {
      startDate: string
      endDate: string
      status?: InstanceStatus
}

export interface GetCalendarParams {
      startDate: string
      endDate: string
      status?: InstanceStatus
}

// ===== Constants =====
export const DAYS_OF_WEEK: DayOfWeek[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
]

export const DAY_ABBREVIATIONS: Record<DayOfWeek, string> = {
      sunday: 'S',
      monday: 'M',
      tuesday: 'T',
      wednesday: 'W',
      thursday: 'T',
      friday: 'F',
      saturday: 'S',
}

export const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
      sunday: 'Sunday',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
}

export const DEFAULT_TIME_SLOT: TimeSlot = {
      startTime: '',
      endTime: '',
}
