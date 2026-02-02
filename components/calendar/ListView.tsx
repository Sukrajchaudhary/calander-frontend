"use client"

import * as React from "react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import type { CalendarEvent, InstanceStatus, ClassStatus, DayOfWeek } from "@/types/calendar"
import { DAYS_OF_WEEK, DAY_ABBREVIATIONS } from "@/types/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
      Popover,
      PopoverContent,
      PopoverTrigger,
} from "@/components/ui/popover"
import { MoreHorizontal, ChevronDown, RefreshCcw, Eye, Edit, XCircle, AlertTriangle } from "lucide-react"

interface ListViewProps {
      events: CalendarEvent[]
      onEventClick?: (event: CalendarEvent) => void
      onStatusChange?: (eventId: string, status: InstanceStatus, isRecurring: boolean) => void
}

export function ListView({
      events,
      onEventClick,
      onStatusChange,
}: ListViewProps) {
      const getStatusBadge = (status: InstanceStatus | ClassStatus) => {
            switch (status) {
                  case "completed":
                        return <Badge variant="completed">Completed</Badge>
                  case "cancelled":
                        return <Badge variant="cancelled">Cancelled</Badge>
                  case "scheduled":
                  case "active":
                  default:
                        return <Badge variant="scheduled">Scheduled</Badge>
            }
      }

      const getDayBadges = (days: DayOfWeek[]) => {
            return DAYS_OF_WEEK.map((day) => {
                  const isActive = days.includes(day)
                  return (
                        <span
                              key={day}
                              className={cn(
                                    "inline-flex items-center justify-center h-5 w-5 rounded text-xs font-medium transition-colors",
                                    isActive
                                          ? "bg-amber-500 text-amber-950"
                                          : "bg-muted text-muted-foreground"
                              )}
                        >
                              {DAY_ABBREVIATIONS[day]}
                        </span>
                  )
            })
      }

      // Extract recurrence days from event if available
      const getRecurrenceDays = (event: CalendarEvent): DayOfWeek[] => {
            if (!event.isRecurring || !event.recurrence) return []

            const recurrence = event.recurrence
            if (recurrence.type === "weekly" && "weeklyDays" in recurrence) {
                  return recurrence.weeklyDays
            }
            if (recurrence.type === "custom" && "customDays" in recurrence) {
                  return recurrence.customDays
            }
            if (recurrence.type === "daily") {
                  return DAYS_OF_WEEK // All days
            }
            return []
      }

      const isCancelled = (status: InstanceStatus | ClassStatus) => {
            return status === "cancelled"
      }

      return (
            <div className="w-full">
                  {/* Table Header */}
                  <div className="grid grid-cols-[120px_80px_1fr_140px_120px_100px_120px_60px] gap-4 px-4 py-3 border-b border-border text-sm text-muted-foreground bg-muted/30">
                        <div>Date</div>
                        <div>Time</div>
                        <div>Class Type</div>
                        <div>Instructor</div>
                        <div>Room</div>
                        <div className="text-center">Bookings</div>
                        <div>Status</div>
                        <div>Actions</div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border">
                        {events.map((event) => {
                              const recurrenceDays = getRecurrenceDays(event)
                              const bookedCount = event.bookedCount ?? 0
                              const capacity = event.capacity ?? 0
                              const isOverbooked = bookedCount > capacity
                              const cancelled = isCancelled(event.status)

                              return (
                                    <div
                                          key={event.id}
                                          className={cn(
                                                "grid grid-cols-[120px_80px_1fr_140px_120px_100px_120px_60px] gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors",
                                                cancelled && "bg-red-500/5"
                                          )}
                                    >
                                          {/* Date */}
                                          <div className={cn(
                                                "text-sm font-medium",
                                                cancelled && "text-muted-foreground"
                                          )}>
                                                {format(parseISO(event.scheduledDate), "EEE, MMM d")}
                                          </div>

                                          {/* Time */}
                                          <div className={cn(
                                                "text-sm text-muted-foreground",
                                                cancelled && "line-through"
                                          )}>
                                                {event.startTime}
                                          </div>

                                          {/* Class Type */}
                                          <div className="flex items-center gap-2">
                                                {cancelled && (
                                                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                                                )}
                                                <span className={cn(
                                                      "font-medium truncate",
                                                      cancelled && "line-through text-muted-foreground"
                                                )}>
                                                      {event.title}
                                                </span>
                                                {event.isRecurring && !cancelled && (
                                                      <RefreshCcw className="h-4 w-4 text-amber-500 shrink-0" />
                                                )}
                                          </div>

                                          {/* Instructor */}
                                          <div className={cn(
                                                "text-sm text-muted-foreground truncate",
                                                cancelled && "line-through"
                                          )}>
                                                {event.instructor || "—"}
                                          </div>

                                          {/* Room */}
                                          <div className={cn(
                                                "text-sm text-muted-foreground truncate",
                                                cancelled && "line-through"
                                          )}>
                                                {event.location || "—"}
                                          </div>

                                          {/* Bookings */}
                                          <div className="text-center">
                                                {cancelled ? (
                                                      <span className="text-muted-foreground">—</span>
                                                ) : (
                                                      <>
                                                            <span className={cn(
                                                                  "font-medium",
                                                                  isOverbooked ? "text-amber-400" : "text-sky-400"
                                                            )}>
                                                                  {bookedCount}/{capacity}
                                                            </span>
                                                            {isOverbooked && (
                                                                  <span className="text-amber-400 ml-1 text-xs">
                                                                        +{bookedCount - capacity}
                                                                  </span>
                                                            )}
                                                      </>
                                                )}
                                          </div>

                                          {/* Status */}
                                          <div>
                                                <Popover>
                                                      <PopoverTrigger asChild>
                                                            <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                                                                  {getStatusBadge(event.status)}
                                                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                            </button>
                                                      </PopoverTrigger>
                                                      <PopoverContent className="w-56 p-0" align="start">
                                                            <div className="p-2 space-y-1">
                                                                  <button
                                                                        onClick={() => onStatusChange?.(event.id, "scheduled", event.isRecurring)}
                                                                        className={cn(
                                                                              "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                                                                              event.status === "scheduled" && "bg-muted"
                                                                        )}
                                                                  >
                                                                        <Badge variant="scheduled" className="mr-2">Scheduled</Badge>
                                                                        Mark as scheduled
                                                                  </button>
                                                                  <button
                                                                        onClick={() => onStatusChange?.(event.id, "completed", event.isRecurring)}
                                                                        className={cn(
                                                                              "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                                                                              event.status === "completed" && "bg-muted"
                                                                        )}
                                                                  >
                                                                        <Badge variant="completed" className="mr-2">Completed</Badge>
                                                                        Mark as completed
                                                                  </button>
                                                                  <button
                                                                        onClick={() => onStatusChange?.(event.id, "cancelled", event.isRecurring)}
                                                                        className={cn(
                                                                              "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                                                                              event.status === "cancelled" && "bg-muted"
                                                                        )}
                                                                  >
                                                                        <Badge variant="cancelled" className="mr-2">Cancelled</Badge>
                                                                        Mark as cancelled
                                                                  </button>
                                                            </div>

                                                            {event.status === "completed" && (
                                                                  <div className="border-t border-border p-3 space-y-1.5 text-xs text-muted-foreground bg-muted/30">
                                                                        <div className="flex justify-between">
                                                                              <span>Booked:</span>
                                                                              <span className="font-medium text-foreground">{bookedCount}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                              <span>Attended:</span>
                                                                              <span className="font-medium text-emerald-400">{Math.floor(bookedCount * 0.8)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                              <span>No-shows:</span>
                                                                              <span className="font-medium text-red-400">{Math.ceil(bookedCount * 0.2)}</span>
                                                                        </div>
                                                                  </div>
                                                            )}

                                                            {cancelled && (
                                                                  <div className="border-t border-border p-3 bg-red-500/10">
                                                                        <div className="flex items-center gap-2 text-xs text-red-400">
                                                                              <XCircle className="h-3.5 w-3.5" />
                                                                              <span>This class has been cancelled</span>
                                                                        </div>
                                                                  </div>
                                                            )}

                                                            {event.isRecurring && recurrenceDays.length > 0 && !cancelled && (
                                                                  <div className="border-t border-border p-3 bg-muted/30">
                                                                        <div className="text-xs text-muted-foreground mb-2">
                                                                              Recurring at <span className="font-medium text-foreground">{event.startTime}</span>
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                              {getDayBadges(recurrenceDays)}
                                                                        </div>
                                                                  </div>
                                                            )}
                                                      </PopoverContent>
                                                </Popover>
                                          </div>

                                          {/* Actions */}
                                          <div>
                                                <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon-sm">
                                                                  <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => onEventClick?.(event)} className="gap-2">
                                                                  <Eye className="h-4 w-4" />
                                                                  View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onEventClick?.(event)} className="gap-2">
                                                                  <Edit className="h-4 w-4" />
                                                                  Edit Class
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {cancelled ? (
                                                                  <DropdownMenuItem
                                                                        className="gap-2 text-emerald-500 focus:text-emerald-500"
                                                                        onClick={() => onStatusChange?.(event.id, "scheduled", event.isRecurring)}
                                                                  >
                                                                        <RefreshCcw className="h-4 w-4" />
                                                                        Restore Class
                                                                  </DropdownMenuItem>
                                                            ) : (
                                                                  <DropdownMenuItem
                                                                        className="gap-2 text-destructive focus:text-destructive"
                                                                        onClick={() => onStatusChange?.(event.id, "cancelled", event.isRecurring)}
                                                                  >
                                                                        <XCircle className="h-4 w-4" />
                                                                        Cancel Class
                                                                  </DropdownMenuItem>
                                                            )}
                                                      </DropdownMenuContent>
                                                </DropdownMenu>
                                          </div>
                                    </div>
                              )
                        })}

                        {events.length === 0 && (
                              <div className="px-4 py-16 text-center">
                                    <div className="max-w-xs mx-auto">
                                          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                                                <RefreshCcw className="h-8 w-8 text-muted-foreground" />
                                          </div>
                                          <h3 className="font-medium mb-1">No classes scheduled</h3>
                                          <p className="text-sm text-muted-foreground">
                                                No classes found for this period. Try changing filters or date range.
                                          </p>
                                    </div>
                              </div>
                        )}
                  </div>
            </div>
      )
}
