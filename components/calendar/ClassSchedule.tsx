"use client"
import React, { useState, useMemo, useCallback } from "react"
import {
      format,
      startOfWeek,
      endOfWeek,
      addWeeks,
      subWeeks,
      addDays,
      startOfMonth,
      endOfMonth,
      addMonths,
      subMonths,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
} from "@/components/ui/select"
import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ToastContainer } from "@/components/ui/toast"
import { useToast } from "@/hooks/useToast"
import {
      useClasses,
      useCalendarView,
      useCreateClass,
      useUpdateClass,
      useUpdateClassStatus,
      useUpdateInstanceStatus,
      useUpdateSpecificInstance,
      useDeleteClass,
} from "@/hooks/useCalendarApi"
import { WeekView } from "./WeekView"
import { ListView } from "./ListView"
import { CreateClassModal } from "./CreateClassModal"
import { EditClassModal } from "./EditClassModal"
import type {
      CalendarEvent,
      ViewMode,
      DateViewMode,
      EventFilter,
      CreateClassRequest,
      UpdateClassRequest,
      InstanceStatus,
      ClassStatus,
} from "@/types/calendar"
import {
      Search,
      ChevronLeft,
      ChevronRight,
      CalendarIcon,
      ListIcon,
      Plus,
      RefreshCw,
      AlertCircle,
} from "lucide-react"

export function ClassSchedule() {
      // Toast hook
      const { toasts, removeToast, success, error: showError, info, warning } = useToast()

      // State
      const [viewMode, setViewMode] = useState<ViewMode>("calendar")
      const [dateViewMode, setDateViewMode] = useState<DateViewMode>("week")
      const [currentDate, setCurrentDate] = useState(new Date())
      const [eventFilter, setEventFilter] = useState<EventFilter>("all")
      const [searchQuery, setSearchQuery] = useState("")
      const [debouncedSearch, setDebouncedSearch] = useState("")
      const [selectedBranch, setSelectedBranch] = useState("branch1")
      const [showCreateModal, setShowCreateModal] = useState(false)
      const [showEditModal, setShowEditModal] = useState(false)
      const [showDeleteDialog, setShowDeleteDialog] = useState(false)
      const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
      const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null)

      // Debounce search query for API calls
      React.useEffect(() => {
            const timer = setTimeout(() => {
                  setDebouncedSearch(searchQuery)
            }, 500)
            return () => clearTimeout(timer)
      }, [searchQuery])


      // Calculate date range based on view mode
      const dateRange = useMemo(() => {
            if (dateViewMode === "day") {
                  // For day view, end date must be after start date for API
                  const nextDay = addDays(currentDate, 1)
                  return {
                        start: currentDate,
                        end: nextDay,
                        label: format(currentDate, "MMM d, yyyy"),
                        startStr: format(currentDate, "yyyy-MM-dd"),
                        endStr: format(nextDay, "yyyy-MM-dd"),
                  }
            } else if (dateViewMode === "week") {
                  const start = startOfWeek(currentDate, { weekStartsOn: 0 })
                  const end = endOfWeek(currentDate, { weekStartsOn: 0 })
                  return {
                        start,
                        end,
                        label: `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`,
                        startStr: format(start, "yyyy-MM-dd"),
                        endStr: format(end, "yyyy-MM-dd"),
                  }
            } else {
                  const start = startOfMonth(currentDate)
                  const end = endOfMonth(currentDate)
                  return {
                        start,
                        end,
                        label: format(currentDate, "MMMM yyyy"),
                        startStr: format(start, "yyyy-MM-dd"),
                        endStr: format(end, "yyyy-MM-dd"),
                  }
            }
      }, [currentDate, dateViewMode])

      // Build status filter for API
      const statusFilter = useMemo(() => {
            if (eventFilter === "all") return undefined
            // Map "scheduled" back to "active" for the API
            if (eventFilter === "scheduled") return "active"
            return eventFilter
      }, [eventFilter])

      // API queries - Get calendar view with status filter
      const {
            data: calendarData,
            isLoading: isLoadingCalendar,
            refetch: refetchCalendar,
            isError: isCalendarError,
            error: calendarError,
      } = useCalendarView({
            startDate: dateRange.startStr,
            endDate: dateRange.endStr,
            status: statusFilter as InstanceStatus | undefined,
      })

      // Get all classes for list view
      const {
            data: classesData,
            isLoading: isLoadingClasses,
            refetch: refetchClasses,
      } = useClasses({
            status: statusFilter as ClassStatus | undefined,
            search: debouncedSearch || undefined,
            page: 1,
            limit: 100,
      })

      // Mutations
      const createClassMutation = useCreateClass()
      const updateClassMutation = useUpdateClass()
      const updateClassStatusMutation = useUpdateClassStatus()
      const updateInstanceStatusMutation = useUpdateInstanceStatus()
      const updateSpecificInstanceMutation = useUpdateSpecificInstance()
      const deleteClassMutation = useDeleteClass()

      // Transform API data to CalendarEvent format
      const events: CalendarEvent[] = useMemo(() => {
            console.log("[ClassSchedule] Processing data transformation", {
                  hasCalendarData: !!calendarData?.data?.length,
                  calendarCount: calendarData?.data?.length || 0,
                  hasClassesData: !!classesData?.data?.length,
                  classesCount: classesData?.data?.length || 0
            })

            let apiEvents: any[] = []

            // 1. Try to use calendar view data (Unified View) if it has items
            if (calendarData?.data && Array.isArray(calendarData.data) && calendarData.data.length > 0) {
                  apiEvents = calendarData.data.map((item: any) => {
                        let displayStatus = item.status
                        // Normalize 'canceled' or 'CANCELLED' to 'cancelled'
                        if (typeof displayStatus === 'string' && displayStatus.toLowerCase() === 'canceled') {
                              displayStatus = 'cancelled'
                        } else if (typeof displayStatus === 'string' && displayStatus.toLowerCase() === 'cancelled') {
                              displayStatus = 'cancelled'
                        }

                        if (displayStatus === "active") displayStatus = "scheduled"

                        return {
                              id: item.id || item._id,
                              classId: item.classId || item.id || item._id,
                              type: item.type || (item.isRecurring ? "recurring-instance" : "one-time"),
                              title: item.title,
                              description: item.description,
                              instructor: item.instructor,
                              location: item.location,
                              capacity: item.capacity,
                              bookedCount: item.bookedCount || 0,
                              scheduledDate: item.scheduledDate,
                              startTime: item.startTime,
                              endTime: item.endTime,
                              status: displayStatus,
                              isRecurring: item.isRecurring || item.type === "recurring-instance",
                              recurrence: item.recurrence,
                        }
                  })
            }
            // 2. Fallback to classes search data if calendar view is empty or failed
            else if (classesData?.data && Array.isArray(classesData.data)) {
                  apiEvents = classesData.data.map((cls: any) => {
                        let displayStatus = cls.status
                        // Normalize 'canceled' or 'CANCELLED' to 'cancelled'
                        if (typeof displayStatus === 'string' && displayStatus.toLowerCase() === 'canceled') {
                              displayStatus = 'cancelled'
                        } else if (typeof displayStatus === 'string' && displayStatus.toLowerCase() === 'cancelled') {
                              displayStatus = 'cancelled'
                        }

                        if (displayStatus === "active") displayStatus = "scheduled"

                        return {
                              id: cls.id || cls._id,
                              classId: cls.id || cls._id,
                              type: cls.isRecurring ? "recurring-instance" : "one-time",
                              title: cls.title,
                              description: cls.description,
                              instructor: cls.instructor,
                              location: cls.location,
                              capacity: cls.capacity,
                              bookedCount: 0,
                              // Handle various date formats from the classes API
                              scheduledDate: cls.scheduledDate || cls.recurrence?.startDate || new Date().toISOString(),
                              startTime: cls.startTime || "09:00",
                              endTime: cls.endTime || "10:00",
                              status: displayStatus,
                              isRecurring: cls.isRecurring || false,
                              recurrence: cls.recurrence,
                        }
                  })
            }

            return apiEvents
      }, [calendarData, classesData])

      // Filter events by search query (status is already filtered by API)
      const filteredEvents = useMemo(() => {
            let filtered = events

            // Apply status filter on client side if API doesn't support it
            if (eventFilter !== "all") {
                  filtered = filtered.filter((event) => event.status === eventFilter)
            }

            // Apply search filter
            if (searchQuery) {
                  const query = searchQuery.toLowerCase()
                  filtered = filtered.filter(
                        (event) =>
                              event.title.toLowerCase().includes(query) ||
                              event.instructor?.toLowerCase().includes(query) ||
                              event.location?.toLowerCase().includes(query)
                  )
            }
            return filtered
      }, [events, eventFilter, searchQuery])

      // Navigation handlers
      const goToToday = () => {
            setCurrentDate(new Date())
            info("Navigated to today")
      }

      const goToPrevious = () => {
            if (dateViewMode === "day") {
                  setCurrentDate(addDays(currentDate, -1))
            } else if (dateViewMode === "week") {
                  setCurrentDate(subWeeks(currentDate, 1))
            } else {
                  setCurrentDate(subMonths(currentDate, 1))
            }
      }

      const goToNext = () => {
            if (dateViewMode === "day") {
                  setCurrentDate(addDays(currentDate, 1))
            } else if (dateViewMode === "week") {
                  setCurrentDate(addWeeks(currentDate, 1))
            } else {
                  setCurrentDate(addMonths(currentDate, 1))
            }
      }

      // Handlers
      const handleEventClick = (event: CalendarEvent) => {
            setSelectedEvent(event)
            setShowEditModal(true)
      }

      // Handle status change - uses correct endpoint based on event type
      const handleStatusChange = async (event: CalendarEvent, status: InstanceStatus) => {
            try {
                  // Map 'scheduled' to 'active' for API
                  const apiStatus = status === 'scheduled' ? 'active' : status

                  if (event.id === event.classId) {
                        // For one-time classes or parent class definitions
                        await updateClassStatusMutation.mutateAsync({
                              classId: event.classId,
                              status: apiStatus as ClassStatus,
                        })
                  } else {
                        // For specific instances of recurring classes
                        await updateSpecificInstanceMutation.mutateAsync({
                              classId: event.classId,
                              scheduledDate: event.scheduledDate,
                              data: { status },
                        })
                  }

                  success("Status Updated", `Class status changed to ${status}`)
                  refetchCalendar()
                  refetchClasses()
            } catch (err: any) {
                  const errorData = err.response?.data
                  // Handle validation errors with field-specific messages
                  if (errorData?.errors && Array.isArray(errorData.errors)) {
                        const errorMessages = errorData.errors
                              .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
                              .join("\n")
                        showError(
                              errorData.title || "Update Failed",
                              errorMessages || errorData.message || "Failed to update status"
                        )
                  } else {
                        showError(
                              errorData?.title || "Update Failed",
                              errorData?.message || err.message || "Failed to update status"
                        )
                  }
            }
      }

      // Handle delete class
      const handleDeleteClick = (event: CalendarEvent) => {
            setEventToDelete(event)
            setShowDeleteDialog(true)
      }

      const handleConfirmDelete = async () => {
            if (!eventToDelete) return

            try {
                  await deleteClassMutation.mutateAsync(eventToDelete.classId || eventToDelete.id)
                  success("Class Deleted", `"${eventToDelete.title}" has been deleted`)
                  setShowDeleteDialog(false)
                  setEventToDelete(null)
                  refetchCalendar()
                  refetchClasses()
            } catch (err: any) {
                  const errorData = err.response?.data
                  showError(
                        errorData?.title || "Delete Failed",
                        errorData?.message || err.message || "Failed to delete class"
                  )
            }
      }


      const handleCreateClass = async (data: CreateClassRequest) => {
            try {
                  console.log("Creating class with data:", JSON.stringify(data, null, 2))

                  const result = await createClassMutation.mutateAsync(data)
                  console.log("Create class result:", result)

                  const instanceCount = result.data?.instanceCount || 0
                  success(
                        "Class Created",
                        `"${data.title}" has been scheduled${instanceCount > 0 ? ` with ${instanceCount} instances` : ""}`
                  )
                  setShowCreateModal(false)

                  // Refetch data
                  refetchCalendar()
                  refetchClasses()
            } catch (err: any) {
                  console.error("Create class error:", err)
                  const errorData = err.response?.data

                  // Handle validation errors with field-specific messages
                  if (errorData?.errors && Array.isArray(errorData.errors)) {
                        const errorMessages = errorData.errors
                              .map((e: { field: string; message: string }) => `• ${e.message}`)
                              .join("\n")
                        showError(
                              errorData.title || "Validation Error",
                              errorMessages || errorData.message || "Please fix the errors and try again"
                        )
                  } else {
                        showError(
                              errorData?.title || "Creation Failed",
                              errorData?.message || err.message || "Failed to create class schedule"
                        )
                  }
            }
      }

      const handleUpdateClass = async (id: string, data: UpdateClassRequest) => {
            try {
                  await updateClassMutation.mutateAsync({ id, data })
                  success("Class Updated", "The class has been updated successfully")
                  setShowEditModal(false)
                  setSelectedEvent(null)

                  // Refetch data
                  refetchCalendar()
                  refetchClasses()
            } catch (err: any) {
                  const errorData = err.response?.data
                  // Handle validation errors with field-specific messages
                  if (errorData?.errors && Array.isArray(errorData.errors)) {
                        const errorMessages = errorData.errors
                              .map((e: { field: string; message: string }) => `• ${e.message}`)
                              .join("\n")
                        showError(
                              errorData.title || "Validation Error",
                              errorMessages || errorData.message || "Please fix the errors and try again"
                        )
                  } else {
                        showError(
                              errorData?.title || "Update Failed",
                              errorData?.message || err.message || "Failed to update class"
                        )
                  }
            }
      }

      const handleRefresh = () => {
            refetchCalendar()
            refetchClasses()
            info("Refreshing data...")
      }

      const handleUpdateSpecificInstance = async (
            classId: string,
            scheduledDate: string,
            data: any, // Using any here to avoid strict type checks temporarily but we know the structure
            startTime?: string
      ) => {
            try {
                  await updateSpecificInstanceMutation.mutateAsync({
                        classId,
                        scheduledDate,
                        data,
                        startTime,
                  })
                  success("Instance Updated", "The specific class instance has been updated")
                  setShowEditModal(false)
                  setSelectedEvent(null)

                  // Refetch data
                  refetchCalendar()
                  refetchClasses()
            } catch (err: any) {
                  const errorData = err.response?.data
                  showError(
                        errorData?.title || "Update Failed",
                        errorData?.message || err.message || "Failed to update instance"
                  )
            }
      }

      const isLoading = isLoadingCalendar || isLoadingClasses

      return (
            <div className="min-h-screen bg-background text-foreground">
                  {/* Toast Container */}
                  <ToastContainer toasts={toasts} onClose={removeToast} />

                  {/* Top Bar */}
                  <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur ">
                        <div className="flex items-center justify-between h-16 px-6">
                              {/* Logo */}
                              <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded  from-sky-500 to-indigo-600 flex items-center justify-center">
                                          <CalendarIcon className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="font-semibold text-lg hidden sm:block">Scheduling System
                                    </span>
                              </div>

                              {/* Search */}
                              <div className="flex-1 max-w-md mx-8">
                                    <Input
                                          icon={<Search className="h-4 w-4" />}
                                          placeholder="Search classes..."
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          className="bg-muted/50"
                                    />
                              </div>

                              {/* Branch Selector & Actions */}
                              <div className="flex items-center gap-4">
                                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                          <SelectTrigger className="w-44">
                                                <SelectValue placeholder="Select Branch" />
                                          </SelectTrigger>
                                          <SelectContent>
                                                <SelectItem value="branch1">Branch/Location 1</SelectItem>
                                                <SelectItem value="branch2">Branch/Location 2</SelectItem>
                                                <SelectItem value="branch3">Branch/Location 3</SelectItem>
                                          </SelectContent>
                                    </Select>

                                    <div className="h-8 w-8 rounded-full  from-sky-500 to-indigo-600 flex items-center justify-center text-sm font-medium text-white">
                                          SN
                                    </div>
                              </div>
                        </div>
                  </header>

                  <main className="p-6">
                        {/* Tab Navigation */}
                        <div className="flex items-center gap-2 mb-6">
                              <Button variant="default" size="sm" className="bg-sky-500 hover:bg-sky-600">
                                    Class Schedule
                              </Button>
                              <Button variant="ghost" size="sm">
                                    Class Types
                              </Button>
                        </div>

                        {/* Page Header */}
                        <div className="flex items-center justify-between mb-6">
                              <div>
                                    <h1 className="text-2xl font-semibold">Class Schedule</h1>
                                    <p className="text-muted-foreground">
                                          Manage recurring schedules and one-off classes.
                                    </p>
                              </div>
                              <div className="flex items-center gap-3">
                                    <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={handleRefresh}
                                          disabled={isLoading}
                                    >
                                          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                                    </Button>
                                    <Button variant="premium" onClick={() => setShowCreateModal(true)}>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Schedule Class
                                    </Button>
                              </div>
                        </div>

                        {/* Error Banner */}
                        {isCalendarError && (
                              <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                                    <div>
                                          <p className="text-sm font-medium text-red-400">Failed to load calendar data</p>
                                          <p className="text-xs text-red-400/70">
                                                {(calendarError as any)?.message || "Please check your API connection"}
                                          </p>
                                    </div>
                                    <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleRefresh}
                                          className="ml-auto border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    >
                                          Retry
                                    </Button>
                              </div>
                        )}

                        {/* View Controls */}
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                              {/* Calendar/List Toggle */}
                              <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
                                    <Button
                                          variant={viewMode === "calendar" ? "secondary" : "ghost"}
                                          size="sm"
                                          onClick={() => setViewMode("calendar")}
                                          className="gap-2"
                                    >
                                          <CalendarIcon className="h-4 w-4" />
                                          Calendar
                                    </Button>
                                    <Button
                                          variant={viewMode === "list" ? "secondary" : "ghost"}
                                          size="sm"
                                          onClick={() => setViewMode("list")}
                                          className="gap-2"
                                    >
                                          <ListIcon className="h-4 w-4" />
                                          List
                                    </Button>
                              </div>

                              {/* Date Navigation */}
                              <div className="flex items-center gap-4">
                                    <Button variant="outline" size="sm" onClick={goToToday}>
                                          Today
                                    </Button>

                                    <div className="flex items-center gap-2">
                                          <Button variant="ghost" size="icon-sm" onClick={goToPrevious}>
                                                <ChevronLeft className="h-4 w-4" />
                                          </Button>
                                          <span className="text-sm font-medium  text-center">
                                                {dateRange.label}
                                          </span>
                                          <Button variant="ghost" size="icon-sm" onClick={goToNext}>
                                                <ChevronRight className="h-4 w-4" />
                                          </Button>
                                    </div>

                                    {/* Day/Week/Month Toggle */}
                                    <div className="flex items-center p-1 bg-muted/50 rounded-lg">
                                          <Button
                                                variant={dateViewMode === "day" ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setDateViewMode("day")}
                                                className={cn(
                                                      "transition-all duration-200 rounded-sm",
                                                      dateViewMode === "day"
                                                            ? "bg-[#FFDFBE] text-black shadow-sm hover:bg-[#FFDFBE]/90"
                                                            : "hover:bg-muted"
                                                )}
                                          >
                                                Day
                                          </Button>
                                          <Button
                                                variant={dateViewMode === "week" ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setDateViewMode("week")}
                                                className={cn(
                                                      "transition-all duration-200",
                                                      dateViewMode === "week"
                                                            ? "bg-[#FFDFBE] text-black shadow-sm hover:bg-[#FFDFBE]/90"
                                                            : "hover:bg-muted"
                                                )}
                                          >
                                                Week
                                          </Button>
                                          <Button
                                                variant={dateViewMode === "month" ? "default" : "ghost"}
                                                size="sm"
                                                onClick={() => setDateViewMode("month")}
                                                className={cn(
                                                      "transition-all duration-200",
                                                      dateViewMode === "month"
                                                            ? "bg-[#FFDFBE] text-black shadow-sm hover:bg-[#FFDFBE]/90"
                                                            : "hover:bg-muted"
                                                )}
                                          >
                                                Month
                                          </Button>
                                    </div>
                              </div>

                              {/* Event Filter - Uses API filtering */}
                              <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as EventFilter)}>
                                    <SelectTrigger className="w-36">
                                          <SelectValue placeholder="Filter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                          <SelectItem value="all">All Events</SelectItem>
                                          <SelectItem value="completed">Completed</SelectItem>
                                          <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                              </Select>
                        </div>

                        {/* Content Area */}
                        <div className="border border-border rounded-xl overflow-hidden bg-card/30">
                              {isLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                          <div className="flex flex-col items-center gap-3">
                                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                                <p className="text-sm text-muted-foreground">Loading calendar...</p>
                                          </div>
                                    </div>
                              ) : viewMode === "calendar" ? (
                                    <WeekView
                                          currentDate={currentDate}
                                          events={filteredEvents}
                                          onEventClick={handleEventClick}
                                    />
                              ) : (
                                    <ListView
                                          events={filteredEvents}
                                          onEventClick={handleEventClick}
                                          onStatusChange={handleStatusChange}
                                          onDelete={handleDeleteClick}
                                    />
                              )}
                        </div>

                        {/* Stats */}
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Total: {filteredEvents.length} classes</span>
                              <span>•</span>
                              <span>Completed: {filteredEvents.filter(e => e.status === "completed").length}</span>
                              <span>•</span>
                              <span>Cancelled: {filteredEvents.filter(e => e.status === "cancelled").length}</span>
                        </div>
                  </main>

                  {/* Create Class Modal */}
                  <CreateClassModal
                        isOpen={showCreateModal}
                        onClose={() => setShowCreateModal(false)}
                        onSubmit={handleCreateClass}
                        isLoading={createClassMutation.isPending}
                  />

                  {/* Edit Class Modal */}
                  <EditClassModal
                        isOpen={showEditModal}
                        onClose={() => {
                              setShowEditModal(false)
                              setSelectedEvent(null)
                        }}
                        onSubmit={handleUpdateClass}
                        onUpdateInstance={handleUpdateSpecificInstance}
                        event={selectedEvent}
                        isLoading={updateClassMutation.isPending || updateSpecificInstanceMutation.isPending}
                  />

                  {/* Delete Confirmation Dialog */}
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogContent>
                              <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                    <AlertDialogDescription>
                                          Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
                                          {eventToDelete?.isRecurring && (
                                                <span className="block mt-2 text-amber-400">
                                                      This is a recurring class. All future instances will also be deleted.
                                                </span>
                                          )}
                                    </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setEventToDelete(null)}>
                                          Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                          onClick={handleConfirmDelete}
                                          className="bg-destructive text-white hover:bg-destructive/90"
                                    >
                                          {deleteClassMutation.isPending ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                              </AlertDialogFooter>
                        </AlertDialogContent>
                  </AlertDialog>
            </div>
      )
}
