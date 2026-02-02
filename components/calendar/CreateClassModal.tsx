"use client"

import * as React from "react"
import { useState } from "react"
import { Upload, Plus, Trash2, Clock, ChevronDown, Check } from "lucide-react"
import { format, getDaysInMonth, startOfMonth, getDay, eachDayOfInterval, isSameDay } from "date-fns"
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
      Popover,
      PopoverContent,
      PopoverTrigger,
} from "@/components/ui/popover"
import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
} from "@/components/ui/dialog"
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker"
import type {
      CreateClassRequest,
      RecurrenceType,
      DayOfWeek,
      TimeSlot,
      DayWiseTimeSlot,
      MonthlyDayWiseTimeSlot,
      CreateClassFormState,
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

// Basic constants removed, now dynamic logic in component

const DEFAULT_FORM_STATE: CreateClassFormState = {
      // Basic info
      title: "",
      description: "",
      instructor: "",
      location: "",
      capacity: 0,
      isRecurring: false,
      // One-time fields
      scheduledDate: undefined,
      startTime: "09:00",
      endTime: "10:00",
      // Recurring fields
      recurrenceType: "weekly" as RecurrenceType,
      recurrenceStartDate: undefined,
      recurrenceEndDate: undefined,
      // Daily
      dailyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }],
      // Weekly & Custom
      dayWiseTimeSlots: [],
      selectedWeeklyDays: [],
      customInterval: 2,
      // Monthly / Specific Range
      selectedSpecificDates: [],
      specificDateSlots: [],
      selectedMonthlyDates: [],
      monthlyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }],
      selectedMonthlyDays: [],
}

export function CreateClassModal({
      isOpen,
      onClose,
      onSubmit,
      isLoading = false,
}: CreateClassModalProps) {
      const [form, setForm] = useState(DEFAULT_FORM_STATE)

      const updateForm = <K extends keyof CreateClassFormState>(key: K, value: CreateClassFormState[K]) => {
            setForm((prev: CreateClassFormState) => ({ ...prev, [key]: value }))
      }

      // SlotRow Helper
      const renderSlotRow = (
            label: string,
            slots: TimeSlot[],
            onAdd: () => void,
            onUpdate: (index: number, field: keyof TimeSlot, value: string) => void,
            onRemove: (index: number) => void
      ) => (
            <div className="grid grid-cols-[120px_1fr] items-center gap-6 py-6 border-b border-muted/50 last:border-0 hover:bg-muted/5 transition-colors group px-2 min-w-max">
                  <div className="sticky left-0 bg-background z-10 font-semibold text-sm text-foreground/80 first-letter:uppercase text-center py-2 pr-4 border-r border-muted/50 shadow-[4px_0_4px_-2px_rgba(0,0,0,0.05)]">
                        {label}
                  </div>
                  <div className="flex gap-4 items-center">
                        {slots.map((slot, index) => (
                              <div key={index} className="relative flex items-center justify-center group/slot shrink-0 min-w-[180px]">
                                    <div className="flex items-center bg-background border rounded-lg px-3 py-1.5 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all shadow-sm">
                                          <input
                                                type="time"
                                                value={slot.startTime}
                                                onChange={(e) => onUpdate(index, "startTime", e.target.value)}
                                                className="bg-transparent border-none outline-none text-xs w-[65px] font-medium cursor-pointer"
                                          />
                                          <span className="mx-1 text-muted-foreground font-light">-</span>
                                          <input
                                                type="time"
                                                value={slot.endTime}
                                                onChange={(e) => onUpdate(index, "endTime", e.target.value)}
                                                className="bg-transparent border-none outline-none text-xs w-[65px] font-medium cursor-pointer"
                                          />
                                          <Clock className="w-3.5 h-3.5 text-muted-foreground ml-2 opacity-50 transition-colors group-focus-within/slot:text-sky-500" />
                                    </div>
                                    <button
                                          onClick={() => onRemove(index)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/slot:opacity-100 transition-opacity hover:bg-red-600 shadow-sm z-10 cursor-pointer"
                                    >
                                          <Trash2 className="w-3 h-3" />
                                    </button>
                              </div>
                        ))}
                        <button
                              onClick={onAdd}
                              className="w-9 h-9 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-sm transition-colors shrink-0 cursor-pointer"
                              title="Add Time Slot"
                        >
                              <Plus className="w-5 h-5" />
                        </button>
                  </div>
            </div>
      )

      // Time Slot Handlers (Daily, Yearly)
      const updateTimeSlot = (type: "daily" | "yearly" | "weekly" | "monthly", index: number, field: keyof TimeSlot, value: string) => {
            const key = `${type}TimeSlots` as keyof CreateClassFormState
            const currentSlots = form[key] as TimeSlot[]
            updateForm(
                  key as any,
                  currentSlots.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
            )
      }

      const addTimeSlot = (type: "daily" | "yearly" | "weekly" | "monthly") => {
            const key = `${type}TimeSlots` as keyof CreateClassFormState
            const currentSlots = form[key] as TimeSlot[]
            updateForm(key as any, [...currentSlots, { startTime: "", endTime: "" }])
      }

      const removeTimeSlot = (type: "daily" | "yearly" | "weekly" | "monthly", index: number) => {
            const key = `${type}TimeSlots` as keyof CreateClassFormState
            const currentSlots = form[key] as TimeSlot[]
            updateForm(key as any, currentSlots.filter((_, i) => i !== index))
      }

      // Day-Wise Slot Handlers (Weekly, Custom)
      const addDayTimeSlot = (day: DayOfWeek) => {
            const dayWiseTimeSlots = [...form.dayWiseTimeSlots]
            const dayIndex = dayWiseTimeSlots.findIndex((d) => d.day === day)
            if (dayIndex >= 0) {
                  dayWiseTimeSlots[dayIndex] = {
                        ...dayWiseTimeSlots[dayIndex],
                        timeSlots: [...dayWiseTimeSlots[dayIndex].timeSlots, { startTime: "", endTime: "" }]
                  }
            } else {
                  dayWiseTimeSlots.push({ day, timeSlots: [{ startTime: "", endTime: "" }] })
            }
            updateForm("dayWiseTimeSlots", dayWiseTimeSlots)
      }

      const removeDayTimeSlot = (day: DayOfWeek, slotIndex: number) => {
            const dayWiseTimeSlots = [...form.dayWiseTimeSlots]
            const dayIndex = dayWiseTimeSlots.findIndex((d) => d.day === day)
            if (dayIndex >= 0) {
                  const newSlots = dayWiseTimeSlots[dayIndex].timeSlots.filter((_: TimeSlot, i: number) => i !== slotIndex)
                  dayWiseTimeSlots[dayIndex] = { ...dayWiseTimeSlots[dayIndex], timeSlots: newSlots }
                  updateForm("dayWiseTimeSlots", dayWiseTimeSlots)
            }
      }

      const updateDayTimeSlot = (day: DayOfWeek, slotIndex: number, field: keyof TimeSlot, value: string) => {
            const dayWiseTimeSlots = [...form.dayWiseTimeSlots]
            const dayIndex = dayWiseTimeSlots.findIndex((d) => d.day === day)
            if (dayIndex >= 0) {
                  const newSlots = dayWiseTimeSlots[dayIndex].timeSlots.map((slot: TimeSlot, i: number) =>
                        i === slotIndex ? { ...slot, [field]: value } : slot
                  )
                  dayWiseTimeSlots[dayIndex] = { ...dayWiseTimeSlots[dayIndex], timeSlots: newSlots }
                  updateForm("dayWiseTimeSlots", dayWiseTimeSlots)
            }
      }

      const toggleWeeklyDay = (dayId: DayOfWeek) => {
            const isSelected = form.selectedWeeklyDays.includes(dayId)
            const newSelected = isSelected
                  ? form.selectedWeeklyDays.filter(d => d !== dayId)
                  : [...form.selectedWeeklyDays, dayId]

            updateForm("selectedWeeklyDays", newSelected)

            if (!isSelected) {
                  if (!form.dayWiseTimeSlots.find(d => d.day === dayId)) {
                        updateForm("dayWiseTimeSlots", [
                              ...form.dayWiseTimeSlots,
                              { day: dayId, timeSlots: [{ startTime: "09:00", endTime: "10:00" }] }
                        ])
                  }
            } else {
                  updateForm("dayWiseTimeSlots", form.dayWiseTimeSlots.filter(d => d.day !== dayId))
            }
      }

      const toggleSpecificDate = (dateStr: string) => {
            const current = [...form.selectedSpecificDates]
            const isSelected = current.includes(dateStr)

            if (isSelected) {
                  updateForm("selectedSpecificDates", current.filter(d => d !== dateStr))
                  updateForm("specificDateSlots", form.specificDateSlots.filter(s => s.date !== dateStr))
            } else {
                  updateForm("selectedSpecificDates", [...current, dateStr].sort())
                  if (!form.specificDateSlots.find(s => s.date === dateStr)) {
                        updateForm("specificDateSlots", [
                              ...form.specificDateSlots,
                              { date: dateStr, timeSlots: [{ startTime: "09:00", endTime: "10:00" }] }
                        ])
                  }
            }
      }

      const addSpecificDateSlot = (dateStr: string) => {
            const slots = [...form.specificDateSlots]
            const index = slots.findIndex(s => s.date === dateStr)
            if (index >= 0) {
                  slots[index] = { ...slots[index], timeSlots: [...slots[index].timeSlots, { startTime: "", endTime: "" }] }
                  updateForm("specificDateSlots", slots)
            }
      }

      const removeSpecificDateSlot = (dateStr: string, slotIndex: number) => {
            const slots = [...form.specificDateSlots]
            const index = slots.findIndex(s => s.date === dateStr)
            if (index >= 0) {
                  slots[index] = { ...slots[index], timeSlots: slots[index].timeSlots.filter((_, i) => i !== slotIndex) }
                  updateForm("specificDateSlots", slots)
            }
      }

      const updateSpecificDateSlot = (dateStr: string, slotIndex: number, field: keyof TimeSlot, value: string) => {
            const slots = [...form.specificDateSlots]
            const index = slots.findIndex(s => s.date === dateStr)
            if (index >= 0) {
                  slots[index] = {
                        ...slots[index],
                        timeSlots: slots[index].timeSlots.map((slot, i) => i === slotIndex ? { ...slot, [field]: value } : slot)
                  }
                  updateForm("specificDateSlots", slots)
            }
      }

      const toggleMonthlyDateDropdown = (date: number) => {
            const current = [...form.selectedMonthlyDates]
            if (current.includes(date)) {
                  updateForm("selectedMonthlyDates", current.filter(d => d !== date))
            } else {
                  updateForm("selectedMonthlyDates", [...current, date].sort((a, b) => a - b))
            }
      }

      // Helper for formatting date
      const getOrdinal = (d: number) => {
            if (d > 3 && d < 21) return d + 'th';
            switch (d % 10) {
                  case 1: return d + "st";
                  case 2: return d + "nd";
                  case 3: return d + "rd";
                  default: return d + "th";
            }
      }
      const formatDateForApi = (date: Date | undefined): string => {
            return format(date! || new Date(), "yyyy-MM-dd")
      }

      const handleSubmit = () => {
            let request: CreateClassRequest

            if (!form.isRecurring) {
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
                        case "custom":
                              request = {
                                    ...baseRequest,
                                    recurrence: {
                                          type: form.recurrenceType,
                                          startDate,
                                          endDate,
                                          customInterval: form.recurrenceType === "custom" ? form.customInterval : undefined,
                                          dayWiseTimeSlots: form.dayWiseTimeSlots.map(d => ({
                                                day: d.day,
                                                timeSlots: d.timeSlots.filter(ts => ts.startTime && ts.endTime)
                                          })).filter(d => d.timeSlots.length > 0)
                                    } as any,
                              }
                              break
                        case "monthly":
                              request = {
                                    ...baseRequest,
                                    recurrence: {
                                          type: "monthly",
                                          startDate,
                                          endDate,
                                          monthlyDayWiseSlots: form.specificDateSlots.map(s => ({
                                                day: new Date(s.date).getDate(),
                                                timeSlots: s.timeSlots.filter(ts => ts.startTime && ts.endTime)
                                          }))
                                    },
                              }
                              break
                        default:
                              // Fallback for types
                              request = { ...baseRequest } as any
                  }
            }

            console.log("[CreateClassModal] Submitting:", JSON.stringify(request!, null, 2))
            onSubmit(request!)
      }

      const handleClose = () => {
            setForm(DEFAULT_FORM_STATE)
            onClose()
      }

      return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                  <DialogContent className="max-w-[50vw] w-[50vw] h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden">
                        <DialogHeader className="p-6 border-b bg-muted/20">
                              <DialogTitle className="text-2xl font-bold text-sky-600">Create Class Schedule</DialogTitle>
                              <DialogDescription className="text-muted-foreground">
                                    Schedule a new class, either as a one-off event or a recurring series.
                              </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                              {/* Basic Information */}
                              <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                          <div>
                                                <Label className="text-sm mb-2 block font-medium text-foreground/70">Class Title *</Label>
                                                <Input
                                                      value={form.title}
                                                      onChange={(e) => updateForm("title", e.target.value)}
                                                      placeholder="e.g., Introduction to Yoga"
                                                      className="focus-visible:ring-sky-500 h-10 cursor-pointer"
                                                />
                                          </div>
                                          <div>
                                                <Label className="text-sm mb-2 block font-medium text-foreground/70">Description</Label>
                                                <textarea
                                                      value={form.description}
                                                      onChange={(e) => updateForm("description", e.target.value)}
                                                      placeholder="Class description..."
                                                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none h-10"
                                                />
                                          </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                          <div>
                                                <Label className="text-sm mb-2 block text-foreground/70">Instructor</Label>
                                                <Input
                                                      value={form.instructor}
                                                      onChange={(e) => updateForm("instructor", e.target.value)}
                                                      placeholder="Name"
                                                      className="h-10 cursor-pointer"
                                                />
                                          </div>
                                          <div>
                                                <Label className="text-sm mb-2 block text-foreground/70">Location</Label>
                                                <Input
                                                      value={form.location}
                                                      onChange={(e) => updateForm("location", e.target.value)}
                                                      placeholder="Room/Studio"
                                                      className="h-10 cursor-pointer"
                                                />
                                          </div>
                                          <div>
                                                <Label className="text-sm mb-2 block text-foreground/70">Capacity</Label>
                                                <Input
                                                      type="number"
                                                      min={0}
                                                      value={form.capacity}
                                                      onChange={(e) => updateForm("capacity", parseInt(e.target.value) || 0)}
                                                      className="h-10"
                                                />
                                          </div>
                                    </div>
                              </div>

                              <div className="flex items-center justify-between py-4 border-b">
                                    <div>
                                          <Label className="text-base font-semibold">Recurring Schedule</Label>
                                          <p className="text-sm text-muted-foreground">Enable to create a repeating class series</p>
                                    </div>
                                    <Switch
                                          checked={form.isRecurring}
                                          onCheckedChange={(checked) => updateForm("isRecurring", checked)}
                                          className="data-[state=checked]:bg-sky-500"
                                    />
                              </div>

                              {!form.isRecurring ? (
                                    <div className="space-y-6 p-6 border rounded-2xl bg-muted/10">
                                          <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground/80">One-Time Schedule</h4>
                                          <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-semibold">Date</Label>
                                                      <DatePicker date={form.scheduledDate} onDateChange={(d) => updateForm("scheduledDate", d)} className="cursor-pointer" />
                                                </div>
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-semibold">Start Time</Label>
                                                      <Input type="time" value={form.startTime} onChange={(e) => updateForm("startTime", e.target.value)} className="h-10" />
                                                </div>
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-semibold">End Time</Label>
                                                      <Input type="time" value={form.endTime} onChange={(e) => updateForm("endTime", e.target.value)} className="h-10" />
                                                </div>
                                          </div>
                                    </div>
                              ) : (
                                    <div className="space-y-8 p-6 border rounded-2xl bg-muted/10 relative overflow-hidden">
                                          <div className="absolute top-0 right-0 p-4 bg-sky-500/5 rounded-bl-3xl">
                                                <Clock className="w-8 h-8 text-sky-500/20" />
                                          </div>

                                          <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-semibold">Recurrence Type</Label>
                                                      <Select value={form.recurrenceType} onValueChange={(v) => updateForm("recurrenceType", v as any)}>
                                                            <SelectTrigger className="h-10 cursor-pointer"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                  <SelectItem value="daily">Daily</SelectItem>
                                                                  <SelectItem value="weekly">Weekly</SelectItem>
                                                                  <SelectItem value="monthly">Monthly</SelectItem>
                                                                  <SelectItem value="custom">Custom</SelectItem>
                                                            </SelectContent>
                                                      </Select>
                                                </div>
                                                <div className="space-y-2">
                                                      <Label className="text-xs font-semibold text-foreground/70">Class Duration (Start - End Date)</Label>
                                                      <DateRangePicker
                                                            dateRange={{ from: form.recurrenceStartDate, to: form.recurrenceEndDate }}
                                                            onDateRangeChange={(range) => {
                                                                  updateForm("recurrenceStartDate", range?.from)
                                                                  updateForm("recurrenceEndDate", range?.to)
                                                            }}
                                                            placeholder="Select class start and end date"
                                                            className="h-10 cursor-pointer"
                                                      />
                                                </div>
                                          </div>

                                          <div className="space-y-4 pt-4 border-t">
                                                {form.recurrenceType === "daily" && (
                                                      renderSlotRow("Every Day", form.dailyTimeSlots, () => addTimeSlot("daily"), (i, f, v) => updateTimeSlot("daily", i, f, v), (i) => removeTimeSlot("daily", i))
                                                )}

                                                {(form.recurrenceType === "weekly" || form.recurrenceType === "custom" || form.recurrenceType === "monthly") && form.recurrenceStartDate && form.recurrenceEndDate && (
                                                      <div className="space-y-6 pt-4">
                                                            {form.recurrenceType === "custom" && (
                                                                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg w-fit">
                                                                        <span className="text-xs font-medium">Repeat every</span>
                                                                        <Input type="number" value={form.customInterval} onChange={(e) => updateForm("customInterval", parseInt(e.target.value) || 1)} className="w-16 h-8 text-center cursor-pointer" />
                                                                        <span className="text-xs font-medium text-muted-foreground">weeks</span>
                                                                  </div>
                                                            )}

                                                            <div className="space-y-4">
                                                                  <Label className="text-sm font-semibold text-foreground/70">
                                                                        {form.recurrenceType === "monthly" ? "Select Specific Dates" : "Select Days"}
                                                                        <span className="ml-2 text-[10px] text-muted-foreground font-normal">(Calculated from duration)</span>
                                                                  </Label>
                                                                  <Popover>
                                                                        <PopoverTrigger asChild>
                                                                              <Button variant="outline" className="w-full justify-between h-12 text-left font-normal border-dashed border-2 hover:border-sky-500 hover:bg-sky-50 transition-all">
                                                                                    <div className="flex gap-2 overflow-hidden items-center">
                                                                                          {form.recurrenceType === "monthly" ? (
                                                                                                form.selectedSpecificDates.length > 0 ? (
                                                                                                      form.selectedSpecificDates.map(dateStr => (
                                                                                                            <span key={dateStr} className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                                                                                                                  {format(new Date(dateStr), "MMM d")}
                                                                                                            </span>
                                                                                                      ))
                                                                                                ) : (
                                                                                                      <span className="text-muted-foreground">Choose dates from your selected range...</span>
                                                                                                )
                                                                                          ) : (
                                                                                                form.selectedWeeklyDays.length > 0 ? (
                                                                                                      form.selectedWeeklyDays.map(day => (
                                                                                                            <span key={day} className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{day.slice(0, 3)}</span>
                                                                                                      ))
                                                                                                ) : (
                                                                                                      <span className="text-muted-foreground">Choose days for this schedule...</span>
                                                                                                )
                                                                                          )}
                                                                                    </div>
                                                                                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                                                                              </Button>
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-[320px] p-2" align="start">
                                                                              {form.recurrenceType === "monthly" ? (() => {
                                                                                    const allDates = eachDayOfInterval({
                                                                                          start: form.recurrenceStartDate || new Date(),
                                                                                          end: form.recurrenceEndDate || new Date()
                                                                                    })
                                                                                    return (
                                                                                          <div className="max-h-60 overflow-y-auto grid grid-cols-1 gap-1 pr-1">
                                                                                                {allDates.map(date => {
                                                                                                      const dateStr = format(date, "yyyy-MM-dd")
                                                                                                      return (
                                                                                                            <button
                                                                                                                  key={dateStr}
                                                                                                                  onClick={() => toggleSpecificDate(dateStr)}
                                                                                                                  className={cn(
                                                                                                                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left",
                                                                                                                        form.selectedSpecificDates.includes(dateStr) ? "bg-sky-50 text-sky-600 font-semibold" : "hover:bg-muted"
                                                                                                                  )}
                                                                                                            >
                                                                                                                  <span>{format(date, "EEEE, MMMM do")}</span>
                                                                                                                  {form.selectedSpecificDates.includes(dateStr) && <Check className="h-4 w-4" />}
                                                                                                            </button>
                                                                                                      )
                                                                                                })}
                                                                                          </div>
                                                                                    )
                                                                              })() : (
                                                                                    <div className="grid grid-cols-1 gap-1">
                                                                                          {DAYS.map(day => (
                                                                                                <button
                                                                                                      key={day.id}
                                                                                                      onClick={() => toggleWeeklyDay(day.id)}
                                                                                                      className={cn(
                                                                                                            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left",
                                                                                                            form.selectedWeeklyDays.includes(day.id) ? "bg-sky-50 text-sky-600 font-semibold" : "hover:bg-muted"
                                                                                                      )}
                                                                                                >
                                                                                                      <span className="capitalize">{day.label}</span>
                                                                                                      {form.selectedWeeklyDays.includes(day.id) && <Check className="h-4 w-4" />}
                                                                                                </button>
                                                                                          ))}
                                                                                    </div>
                                                                              )}
                                                                        </PopoverContent>
                                                                  </Popover>
                                                            </div>

                                                            {((form.recurrenceType === "monthly" ? form.selectedSpecificDates : form.selectedWeeklyDays).length > 0) && (
                                                                  <div className="overflow-x-auto pb-6 [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border rounded-xl shadow-sm bg-background">
                                                                        <div className="min-w-max">
                                                                              <div className="grid grid-cols-[160px_1fr] items-center gap-6 px-2 py-4 bg-muted/50 border-b">
                                                                                    <div className="sticky left-0 bg-muted z-20 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center pr-4 border-r border-muted-foreground/10">Date/Day</div>
                                                                                    <div className="flex gap-4 overflow-hidden">
                                                                                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest min-w-[180px] text-center">Schedule Details</div>
                                                                                    </div>
                                                                              </div>

                                                                              {form.recurrenceType === "monthly" ? (
                                                                                    form.selectedSpecificDates.map(dateStr => {
                                                                                          const slots = form.specificDateSlots.find(s => s.date === dateStr)?.timeSlots || []
                                                                                          return renderSlotRow(
                                                                                                format(new Date(dateStr), "MMM do"),
                                                                                                slots,
                                                                                                () => addSpecificDateSlot(dateStr),
                                                                                                (i, f, v) => updateSpecificDateSlot(dateStr, i, f, v),
                                                                                                (i) => removeSpecificDateSlot(dateStr, i)
                                                                                          )
                                                                                    })
                                                                              ) : (
                                                                                    DAYS.filter(d => form.selectedWeeklyDays.includes(d.id)).map(dayDef => {
                                                                                          const daySlots = form.dayWiseTimeSlots.find(s => s.day === dayDef.id)?.timeSlots || []
                                                                                          return renderSlotRow(
                                                                                                dayDef.label,
                                                                                                daySlots,
                                                                                                () => addDayTimeSlot(dayDef.id),
                                                                                                (i, f, v) => updateDayTimeSlot(dayDef.id, i, f, v),
                                                                                                (i) => removeDayTimeSlot(dayDef.id, i)
                                                                                          )
                                                                                    })
                                                                              )}
                                                                        </div>
                                                                  </div>
                                                            )}
                                                      </div>
                                                )}

                                          </div>
                                    </div>
                              )}
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/10 flex-shrink-0">
                              <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
                              <Button variant="premium" onClick={handleSubmit} disabled={isLoading || !form.title.trim()}>
                                    {isLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                    {isLoading ? "Creating..." : "Create Schedule"}
                              </Button>
                        </div>
                  </DialogContent>
            </Dialog >
      )
}
