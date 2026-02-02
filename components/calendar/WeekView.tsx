"use client"

import * as React from "react"
import {
      format,
      startOfWeek,
      addDays,
      isSameDay,
      parseISO,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { CalendarEvent, InstanceStatus, ClassStatus } from "@/types/calendar"
import { User, MapPin, Users, Clock, XCircle } from "lucide-react"

interface WeekViewProps {
      currentDate: Date
      events: CalendarEvent[]
      onEventClick?: (event: CalendarEvent) => void
}

// Generate time slots from 6 AM to 10 PM
const TIME_SLOTS = [
      { label: "6 AM", hour: 6 },
      { label: "9 AM", hour: 9 },
      { label: "12 PM", hour: 12 },
      { label: "3 PM", hour: 15 },
      { label: "6 PM", hour: 18 },
      { label: "9 PM", hour: 21 },
]

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

      console.log("[WeekView] Current date:", format(currentDate, "yyyy-MM-dd"))
      console.log("[WeekView] Week start:", format(weekStart, "yyyy-MM-dd"))
      console.log("[WeekView] Events received:", events.length, events)

      // Group events by date and return events that fall within a time slot range
      const getEventsForSlot = (day: Date, slotHour: number, nextSlotHour: number) => {
            return events.filter((event) => {
                  try {
                        // Parse the scheduled date - handle both ISO and date-only formats
                        let eventDate: Date
                        if (event.scheduledDate.includes("T")) {
                              eventDate = parseISO(event.scheduledDate)
                        } else {
                              eventDate = parseISO(event.scheduledDate + "T00:00:00")
                        }

                        const eventHour = parseInt(event.startTime.split(":")[0], 10)
                        const sameDay = isSameDay(eventDate, day)

                        // Check if event falls within this time slot range
                        return sameDay && eventHour >= slotHour && eventHour < nextSlotHour
                  } catch (e) {
                        console.error("[WeekView] Error parsing event:", event, e)
                        return false
                  }
            })
      }

      // Get all events for a specific day (for displaying below slots)
      const getEventsForDay = (day: Date) => {
            return events.filter((event) => {
                  try {
                        let eventDate: Date
                        if (event.scheduledDate.includes("T")) {
                              eventDate = parseISO(event.scheduledDate)
                        } else {
                              eventDate = parseISO(event.scheduledDate + "T00:00:00")
                        }
                        return isSameDay(eventDate, day)
                  } catch (e) {
                        return false
                  }
            })
      }

      const getStatusColor = (status: InstanceStatus | ClassStatus) => {
            switch (status) {
                  case "completed":
                        return "border-l-emerald-500"
                  case "cancelled":
                        return "border-l-red-500 opacity-60"
                  case "scheduled":
                  case "active":
                  default:
                        return "border-l-sky-500"
            }
      }

      const isCancelled = (status: InstanceStatus | ClassStatus) => {
            return status === "cancelled"
      }

      return (
            <div className="flex flex-col">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 border-b border-border">
                        <div className="p-4" /> {/* Empty corner */}
                        {weekDays.map((day) => {
                              const dayEvents = getEventsForDay(day)
                              return (
                                    <div
                                          key={day.toISOString()}
                                          className="p-4 text-center border-l border-border"
                                    >
                                          <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                                {format(day, "EEE")}
                                          </div>
                                          <div
                                                className={cn(
                                                      "text-2xl font-semibold mt-1",
                                                      isSameDay(day, new Date()) && "text-sky-400"
                                                )}
                                          >
                                                {format(day, "d")}
                                          </div>
                                          {dayEvents.length > 0 && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                      {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                                                </div>
                                          )}
                                    </div>
                              )
                        })}
                  </div>

                  {/* Time Slot Rows */}
                  {TIME_SLOTS.map((slot, index) => {
                        const nextSlotHour = TIME_SLOTS[index + 1]?.hour || 24

                        return (
                              <div
                                    key={slot.label}
                                    className="grid grid-cols-8 min-h-[120px] border-b border-border"
                              >
                                    {/* Time Label */}
                                    <div className="p-4 text-sm text-muted-foreground font-medium">
                                          {slot.label}
                                    </div>

                                    {/* Day Cells */}
                                    {weekDays.map((day) => {
                                          const slotEvents = getEventsForSlot(day, slot.hour, nextSlotHour)

                                          return (
                                                <div
                                                      key={`${day.toISOString()}-${slot.label}`}
                                                      className="p-2 border-l border-border"
                                                >
                                                      <div className="space-y-2">
                                                            {slotEvents.map((event) => (
                                                                  <div
                                                                        key={event.id}
                                                                        onClick={() => onEventClick?.(event)}
                                                                        className={cn(
                                                                              "p-3 rounded-lg bg-card/50 backdrop-blur border-l-4 cursor-pointer relative",
                                                                              "hover:bg-card/80 transition-all duration-200",
                                                                              getStatusColor(event.status)
                                                                        )}
                                                                  >
                                                                        {/* Cancelled Badge */}
                                                                        {isCancelled(event.status) && (
                                                                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                                                                                    <XCircle className="h-2.5 w-2.5" />
                                                                                    CANCELLED
                                                                              </div>
                                                                        )}

                                                                        {/* Time */}
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                                                              <Clock className="h-3 w-3" />
                                                                              <span>
                                                                                    {event.startTime} - {event.endTime}
                                                                              </span>
                                                                        </div>

                                                                        {/* Title */}
                                                                        <div className={cn(
                                                                              "font-medium text-sm text-foreground line-clamp-2",
                                                                              isCancelled(event.status) && "line-through text-muted-foreground"
                                                                        )}>
                                                                              {event.title}
                                                                        </div>

                                                                        {event.instructor && (
                                                                              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                                                                    <User className="h-3 w-3" />
                                                                                    <span>{event.instructor}</span>
                                                                              </div>
                                                                        )}

                                                                        {event.location && (
                                                                              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                                                                    <MapPin className="h-3 w-3" />
                                                                                    <span>{event.location}</span>
                                                                              </div>
                                                                        )}

                                                                        {event.capacity !== undefined && (
                                                                              <div className="flex items-center gap-1.5 mt-1 text-xs">
                                                                                    <Users className="h-3 w-3 text-rose-400" />
                                                                                    <span className="text-rose-400 font-medium">
                                                                                          {event.bookedCount || 0}/{event.capacity}
                                                                                    </span>
                                                                              </div>
                                                                        )}
                                                                  </div>
                                                            ))}
                                                      </div>
                                                </div>
                                          )
                                    })}
                              </div>
                        )
                  })}

                  {/* Show message if no events in this view */}
                  {events.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                              No classes scheduled for this week
                        </div>
                  )}
            </div>
      )
}
