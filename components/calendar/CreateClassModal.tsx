"use client"

import * as React from "react"
import { useState } from "react"
import { Upload, Plus, Trash2, Clock } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
} from "@/components/ui/select"
import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import type {
      CreateClassRequest,
      RecurrenceType,
      DayOfWeek,
      TimeSlot,
      DAYS_OF_WEEK,
      DAY_FULL_NAMES,
} from "@/types/calendar"

interface CreateClassModalProps {
      isOpen: boolean
      onClose: () => void
      onSubmit: (data: CreateClassRequest) => void
      isLoading?: boolean
}

const DAYS: { id: DayOfWeek; label: string }[] = [
      { id: "sunday", label: "Sunday" },
      { id: "monday", label: "Monday" },
      { id: "tuesday", label: "Tuesday" },
      { id: "wednesday", label: "Wednesday" },
      { id: "thursday", label: "Thursday" },
      { id: "friday", label: "Friday" },
      { id: "saturday", label: "Saturday" },
]

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const DEFAULT_FORM_STATE = {
      // Basic info
      title: "",
      description: "",
      instructor: "",
      location: "",
      capacity: 20,
      isRecurring: false,
      // One-time fields
      scheduledDate: undefined as Date | undefined,
      startTime: "09:00",
      endTime: "10:00",
      // Recurring fields
      recurrenceType: "weekly" as RecurrenceType,
      recurrenceStartDate: undefined as Date | undefined,
      recurrenceEndDate: undefined as Date | undefined,
      // Daily
      dailyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }] as TimeSlot[],
      // Weekly
      weeklyDays: ["monday", "wednesday", "friday"] as DayOfWeek[],
      weeklyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }] as TimeSlot[],
      // Monthly
      monthlyDays: [1, 15] as number[],
      monthlyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }] as TimeSlot[],
      // Custom
      customDays: ["monday", "wednesday", "friday"] as DayOfWeek[],
      customInterval: 2,
      customTimeSlots: [{ startTime: "09:00", endTime: "10:00" }] as TimeSlot[],
}

export function CreateClassModal({
      isOpen,
      onClose,
      onSubmit,
      isLoading = false,
}: CreateClassModalProps) {
      const [form, setForm] = useState(DEFAULT_FORM_STATE)

      const updateForm = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }))
      }

      const addTimeSlot = (type: "daily" | "weekly" | "monthly" | "custom") => {
            const key = `${type}TimeSlots` as keyof typeof form
            const currentSlots = form[key] as TimeSlot[]
            updateForm(key as any, [...currentSlots, { startTime: "", endTime: "" }])
      }

      const removeTimeSlot = (type: "daily" | "weekly" | "monthly" | "custom", index: number) => {
            const key = `${type}TimeSlots` as keyof typeof form
            const currentSlots = form[key] as TimeSlot[]
            updateForm(key as any, currentSlots.filter((_, i) => i !== index))
      }

      const updateTimeSlot = (
            type: "daily" | "weekly" | "monthly" | "custom",
            index: number,
            field: keyof TimeSlot,
            value: string
      ) => {
            const key = `${type}TimeSlots` as keyof typeof form
            const currentSlots = form[key] as TimeSlot[]
            updateForm(
                  key as any,
                  currentSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
            )
      }

      const toggleDay = (type: "weekly" | "custom", day: DayOfWeek) => {
            const key = `${type}Days` as keyof typeof form
            const currentDays = form[key] as DayOfWeek[]
            if (currentDays.includes(day)) {
                  updateForm(key as any, currentDays.filter((d) => d !== day))
            } else {
                  updateForm(key as any, [...currentDays, day])
            }
      }

      const toggleMonthDay = (day: number) => {
            if (form.monthlyDays.includes(day)) {
                  updateForm("monthlyDays", form.monthlyDays.filter((d) => d !== day))
            } else {
                  updateForm("monthlyDays", [...form.monthlyDays, day].sort((a, b) => a - b))
            }
      }

      // Helper function to format date as YYYY-MM-DD
      const formatDateForApi = (date: Date | undefined): string => {
            if (!date) return format(new Date(), "yyyy-MM-dd")
            return format(date, "yyyy-MM-dd")
      }

      const handleSubmit = () => {
            let request: CreateClassRequest

            if (!form.isRecurring) {
                  // One-time class
                  request = {
                        title: form.title,
                        description: form.description || undefined,
                        instructor: form.instructor || undefined,
                        location: form.location || undefined,
                        capacity: form.capacity,
                        isRecurring: false,
                        scheduledDate: formatDateForApi(form.scheduledDate),
                        startTime: form.startTime,
                        endTime: form.endTime,
                  }
            } else {
                  // Recurring class
                  const baseRequest = {
                        title: form.title,
                        description: form.description || undefined,
                        instructor: form.instructor || undefined,
                        location: form.location || undefined,
                        capacity: form.capacity,
                        isRecurring: true as const,
                  }

                  const startDate = formatDateForApi(form.recurrenceStartDate)
                  const endDate = form.recurrenceEndDate ? formatDateForApi(form.recurrenceEndDate) : undefined

                  switch (form.recurrenceType) {
                        case "daily":
                              request = {
                                    ...baseRequest,
                                    recurrence: {
                                          type: "daily",
                                          startDate,
                                          endDate,
                                          dailyTimeSlots: form.dailyTimeSlots.filter((s) => s.startTime && s.endTime),
                                    },
                              }
                              break
                        case "weekly":
                              request = {
                                    ...baseRequest,
                                    recurrence: {
                                          type: "weekly",
                                          startDate,
                                          endDate,
                                          weeklyDays: form.weeklyDays,
                                          weeklyTimeSlots: form.weeklyTimeSlots.filter((s) => s.startTime && s.endTime),
                                    },
                              }
                              break
                        case "monthly":
                              request = {
                                    ...baseRequest,
                                    recurrence: {
                                          type: "monthly",
                                          startDate,
                                          endDate,
                                          monthlyDays: form.monthlyDays,
                                          monthlyTimeSlots: form.monthlyTimeSlots.filter((s) => s.startTime && s.endTime),
                                    },
                              }
                              break
                        case "custom":
                              request = {
                                    ...baseRequest,
                                    recurrence: {
                                          type: "custom",
                                          startDate,
                                          endDate,
                                          customDays: form.customDays,
                                          customInterval: form.customInterval,
                                          customTimeSlots: form.customTimeSlots.filter((s) => s.startTime && s.endTime),
                                    },
                              }
                              break
                  }
            }

            console.log("[CreateClassModal] Submitting:", JSON.stringify(request!, null, 2))
            onSubmit(request!)
      }

      const handleClose = () => {
            setForm(DEFAULT_FORM_STATE)
            onClose()
      }

      const renderTimeSlots = (type: "daily" | "weekly" | "monthly" | "custom") => {
            const key = `${type}TimeSlots` as keyof typeof form
            const slots = form[key] as TimeSlot[]

            return (
                  <div className="space-y-3">
                        <div className="flex items-center justify-between">
                              <Label className="text-sm">Time Slots</Label>
                              <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addTimeSlot(type)}
                              >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Slot
                              </Button>
                        </div>
                        {slots.map((slot, index) => (
                              <div key={index} className="flex items-center gap-3">
                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                          <div className="relative">
                                                <Input
                                                      type="time"
                                                      value={slot.startTime}
                                                      onChange={(e) => updateTimeSlot(type, index, "startTime", e.target.value)}
                                                      className="pr-10"
                                                />
                                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                          </div>
                                          <div className="relative">
                                                <Input
                                                      type="time"
                                                      value={slot.endTime}
                                                      onChange={(e) => updateTimeSlot(type, index, "endTime", e.target.value)}
                                                      className="pr-10"
                                                />
                                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                          </div>
                                    </div>
                                    {slots.length > 1 && (
                                          <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeTimeSlot(type, index)}
                                                className="text-destructive hover:text-destructive"
                                          >
                                                <Trash2 className="h-4 w-4" />
                                          </Button>
                                    )}
                              </div>
                        ))}
                  </div>
            )
      }

      const renderDaySelector = (type: "weekly" | "custom") => {
            const key = `${type}Days` as keyof typeof form
            const selectedDays = form[key] as DayOfWeek[]

            return (
                  <div className="space-y-2">
                        <Label className="text-sm">Select Days</Label>
                        <div className="flex flex-wrap gap-2">
                              {DAYS.map((day) => (
                                    <button
                                          key={day.id}
                                          type="button"
                                          onClick={() => toggleDay(type, day.id)}
                                          className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                                selectedDays.includes(day.id)
                                                      ? "bg-sky-500 text-white"
                                                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                                          )}
                                    >
                                          {day.label}
                                    </button>
                              ))}
                        </div>
                  </div>
            )
      }

      return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                              <DialogTitle>Create Class Schedule</DialogTitle>
                              <DialogDescription>
                                    Schedule a new class, either as a one-off event or a recurring series.
                              </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                    <div>
                                          <Label className="text-sm mb-2 block">Class Title *</Label>
                                          <Input
                                                value={form.title}
                                                onChange={(e) => updateForm("title", e.target.value)}
                                                placeholder="e.g., Introduction to Yoga"
                                          />
                                    </div>

                                    <div>
                                          <Label className="text-sm mb-2 block">Description</Label>
                                          <textarea
                                                value={form.description}
                                                onChange={(e) => updateForm("description", e.target.value)}
                                                placeholder="Class description..."
                                                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                                          />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                <Label className="text-sm mb-2 block">Instructor</Label>
                                                <Input
                                                      value={form.instructor}
                                                      onChange={(e) => updateForm("instructor", e.target.value)}
                                                      placeholder="Instructor name"
                                                />
                                          </div>
                                          <div>
                                                <Label className="text-sm mb-2 block">Location</Label>
                                                <Input
                                                      value={form.location}
                                                      onChange={(e) => updateForm("location", e.target.value)}
                                                      placeholder="Room/Studio"
                                                />
                                          </div>
                                    </div>

                                    <div>
                                          <Label className="text-sm mb-2 block">Capacity</Label>
                                          <Input
                                                type="number"
                                                min={1}
                                                value={form.capacity}
                                                onChange={(e) => updateForm("capacity", parseInt(e.target.value) || 1)}
                                          />
                                    </div>
                              </div>

                              {/* Recurring Toggle */}
                              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div>
                                          <Label className="text-base font-medium">Recurring Schedule</Label>
                                          <p className="text-sm text-muted-foreground">
                                                Enable to create a repeating class schedule
                                          </p>
                                    </div>
                                    <Switch
                                          checked={form.isRecurring}
                                          onCheckedChange={(checked) => updateForm("isRecurring", checked)}
                                    />
                              </div>

                              {/* One-Time Schedule Fields */}
                              {!form.isRecurring && (
                                    <div className="space-y-4 p-4 border border-border rounded-lg">
                                          <h4 className="font-medium">One-Time Schedule</h4>

                                          <div>
                                                <Label className="text-sm mb-2 block">Date</Label>
                                                <DatePicker
                                                      date={form.scheduledDate}
                                                      onDateChange={(date) => updateForm("scheduledDate", date)}
                                                      placeholder="Select date"
                                                />
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                      <Label className="text-sm mb-2 block">Start Time</Label>
                                                      <div className="relative">
                                                            <Input
                                                                  type="time"
                                                                  value={form.startTime}
                                                                  onChange={(e) => updateForm("startTime", e.target.value)}
                                                                  className="pr-10"
                                                            />
                                                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                      </div>
                                                </div>
                                                <div>
                                                      <Label className="text-sm mb-2 block">End Time</Label>
                                                      <div className="relative">
                                                            <Input
                                                                  type="time"
                                                                  value={form.endTime}
                                                                  onChange={(e) => updateForm("endTime", e.target.value)}
                                                                  className="pr-10"
                                                            />
                                                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                      </div>
                                                </div>
                                          </div>
                                    </div>
                              )}

                              {/* Recurring Schedule Fields */}
                              {form.isRecurring && (
                                    <div className="space-y-4 p-4 border border-border rounded-lg">
                                          <h4 className="font-medium">Recurring Schedule</h4>

                                          {/* Recurrence Type */}
                                          <div>
                                                <Label className="text-sm mb-2 block">Recurrence Type</Label>
                                                <Select
                                                      value={form.recurrenceType}
                                                      onValueChange={(value) => updateForm("recurrenceType", value as RecurrenceType)}
                                                >
                                                      <SelectTrigger>
                                                            <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                            <SelectItem value="daily">Daily</SelectItem>
                                                            <SelectItem value="weekly">Weekly</SelectItem>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="custom">Custom (Every N Weeks)</SelectItem>
                                                      </SelectContent>
                                                </Select>
                                          </div>

                                          {/* Date Range */}
                                          <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                      <Label className="text-sm mb-2 block">Start Date</Label>
                                                      <DatePicker
                                                            date={form.recurrenceStartDate}
                                                            onDateChange={(date) => updateForm("recurrenceStartDate", date)}
                                                            placeholder="Start date"
                                                      />
                                                </div>
                                                <div>
                                                      <Label className="text-sm mb-2 block">End Date (Optional)</Label>
                                                      <DatePicker
                                                            date={form.recurrenceEndDate}
                                                            onDateChange={(date) => updateForm("recurrenceEndDate", date)}
                                                            placeholder="End date"
                                                      />
                                                </div>
                                          </div>

                                          {/* Daily Recurrence */}
                                          {form.recurrenceType === "daily" && (
                                                <>
                                                      <p className="text-sm text-muted-foreground">
                                                            Class will repeat every day at the specified times.
                                                      </p>
                                                      {renderTimeSlots("daily")}
                                                </>
                                          )}

                                          {/* Weekly Recurrence */}
                                          {form.recurrenceType === "weekly" && (
                                                <>
                                                      {renderDaySelector("weekly")}
                                                      {renderTimeSlots("weekly")}
                                                </>
                                          )}

                                          {/* Monthly Recurrence */}
                                          {form.recurrenceType === "monthly" && (
                                                <>
                                                      <div className="space-y-2">
                                                            <Label className="text-sm">Select Days of Month</Label>
                                                            <div className="grid grid-cols-7 gap-1">
                                                                  {MONTH_DAYS.map((day) => (
                                                                        <button
                                                                              key={day}
                                                                              type="button"
                                                                              onClick={() => toggleMonthDay(day)}
                                                                              className={cn(
                                                                                    "w-8 h-8 rounded text-sm font-medium transition-colors",
                                                                                    form.monthlyDays.includes(day)
                                                                                          ? "bg-sky-500 text-white"
                                                                                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                                              )}
                                                                        >
                                                                              {day}
                                                                        </button>
                                                                  ))}
                                                            </div>
                                                      </div>
                                                      {renderTimeSlots("monthly")}
                                                </>
                                          )}

                                          {/* Custom Recurrence */}
                                          {form.recurrenceType === "custom" && (
                                                <>
                                                      <div>
                                                            <Label className="text-sm mb-2 block">Repeat Every</Label>
                                                            <div className="flex items-center gap-2">
                                                                  <Input
                                                                        type="number"
                                                                        min={1}
                                                                        value={form.customInterval}
                                                                        onChange={(e) => updateForm("customInterval", parseInt(e.target.value) || 1)}
                                                                        className="w-20"
                                                                  />
                                                                  <span className="text-sm text-muted-foreground">weeks</span>
                                                            </div>
                                                      </div>
                                                      {renderDaySelector("custom")}
                                                      {renderTimeSlots("custom")}
                                                </>
                                          )}
                                    </div>
                              )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                                    Cancel
                              </Button>
                              <Button
                                    variant="premium"
                                    onClick={handleSubmit}
                                    disabled={isLoading || !form.title.trim()}
                              >
                                    {isLoading ? (
                                          <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Creating...
                                          </>
                                    ) : (
                                          <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create Schedule
                                          </>
                                    )}
                              </Button>
                        </div>
                  </DialogContent>
            </Dialog>
      )
}
