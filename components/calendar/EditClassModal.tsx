"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
} from "@/components/ui/select"
import type { CalendarEvent, UpdateClassRequest, UpdateInstanceRequest, ClassStatus, InstanceStatus } from "@/types/calendar"
import { Calendar, User, MapPin, Users, Clock, FileText, Loader2, Layers, CalendarDays, Activity } from "lucide-react"

interface EditClassModalProps {
      isOpen: boolean
      onClose: () => void
      onSubmit: (id: string, data: UpdateClassRequest) => void
      onUpdateInstance?: (classId: string, scheduledDate: string, data: UpdateInstanceRequest, startTime?: string) => void
      event: CalendarEvent | null
      isLoading?: boolean
}

export function EditClassModal({
      isOpen,
      onClose,
      onSubmit,
      onUpdateInstance,
      event,
      isLoading = false,
}: EditClassModalProps) {
      const [updateScope, setUpdateScope] = useState<'series' | 'instance'>('series')
      const [form, setForm] = useState<{
            title: string
            description: string
            instructor: string
            location: string
            capacity: number
            startTime: string
            endTime: string
            status: string
            availability: boolean
      }>({
            title: "",
            description: "",
            instructor: "",
            location: "",
            capacity: 0,
            startTime: "",
            endTime: "",
            status: "scheduled",
            availability: true,
      })


      useEffect(() => {
            if (event) {
                  setForm({
                        title: event.title || "",
                        description: event.description || "",
                        instructor: event.instructor || "",
                        location: event.location || "",
                        capacity: event.capacity ?? 0,
                        startTime: event.startTime || "",
                        endTime: event.endTime || "",
                        status: event.status || "scheduled",
                        availability: event.availability ?? true,
                  })
                  // Default to series if recurring, otherwise irrelevant (but UI will hide toggle)
                  setUpdateScope('series')
            }
      }, [event])

      const handleSubmit = () => {
            if (!event) return


            if (updateScope === 'instance' && onUpdateInstance && event.isRecurring) {
                  const instanceData: UpdateInstanceRequest = {}

                  // For instance updates, we send fields if they differ or just send them to be safe
                  if (form.location !== event.location) instanceData.location = form.location
                  if (form.capacity !== event.capacity) instanceData.capacity = form.capacity
                  if (form.description !== event.description) instanceData.description = form.description
                  if (form.startTime !== event.startTime) instanceData.startTime = form.startTime
                  if (form.endTime !== event.endTime) instanceData.endTime = form.endTime
                  if (form.status !== event.status) instanceData.status = form.status as InstanceStatus

                  // Note: Title/Instructor changes on an instance might not be supported by backend schema 
                  // or might be purely metadata overrides. Based on requirement "Any other field... to override".

                  // Ensure date is formatted as YYYY-MM-DD for the API to match the query param expectation
                  const formattedDate = format(new Date(event.scheduledDate), "yyyy-MM-dd")
                  onUpdateInstance(event.classId, formattedDate, instanceData, event.startTime)
                  return
            }


            const updateData: UpdateClassRequest = {}

            if (form.title !== event.title) updateData.title = form.title
            if (form.description !== event.description) updateData.description = form.description
            if (form.instructor !== event.instructor) updateData.instructor = form.instructor
            if (form.location !== event.location) updateData.location = form.location
            if (form.capacity !== event.capacity) updateData.capacity = form.capacity
            if (form.availability !== event.availability) updateData.availability = form.availability

            // Map 'scheduled' back to 'active' for Class Status if changed
            if (form.status !== event.status) {
                  updateData.status = (form.status === 'scheduled' ? 'active' : form.status) as ClassStatus
            }

            if (form.startTime !== event.startTime) (updateData as any).startTime = form.startTime
            if (form.endTime !== event.endTime) (updateData as any).endTime = form.endTime

            if (Object.keys(updateData).length === 0) {
                  onClose()
                  return
            }

            onSubmit(event.classId || event.id, updateData)
      }

      const handleClose = () => {
            onClose()
      }

      if (!event) return null

      return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                  <DialogContent className="w-[90vw] h-[85vh] bg-card border-border overflow-y-auto rounded-xl shadow-2xl">
                        <DialogHeader className="py-4 border-b bg-gradient-to-r from-muted/20 to-background">
                              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-sky-400" />
                                    {event.isRecurring && updateScope === 'instance' ? 'Edit Instance' : 'Edit Class'}
                              </DialogTitle>
                              <DialogDescription className="text-muted-foreground">
                                    {event.isRecurring
                                          ? "This is a recurring event. Choose how you want to apply changes."
                                          : "Update the class details below."}
                              </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">

                              {event.isRecurring && (
                                    <div className="p-1 bg-muted rounded-lg flex gap-1">
                                          <button
                                                type="button"
                                                onClick={() => setUpdateScope('series')}
                                                className={cn(
                                                      "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all cursor-pointer",
                                                      updateScope === 'series'
                                                            ? "bg-background shadow-sm text-foreground"
                                                            : "text-muted-foreground hover:bg-background/50"
                                                )}
                                          >
                                                <Layers className="h-4 w-4" />
                                                Edit Series
                                          </button>
                                          <button
                                                type="button"
                                                onClick={() => setUpdateScope('instance')}
                                                className={cn(
                                                      "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all cursor-pointer",
                                                      updateScope === 'instance'
                                                            ? "bg-background shadow-sm text-foreground"
                                                            : "text-muted-foreground hover:bg-background/50"
                                                )}
                                          >
                                                <CalendarDays className="h-4 w-4" />
                                                Edit This Instance Only
                                          </button>
                                    </div>
                              )}


                              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">Original Schedule:</span>
                                          <span className="font-medium">
                                                {format(new Date(event.scheduledDate), "EEE, MMM d, yyyy")}
                                          </span>
                                    </div>
                                    {event.isRecurring && updateScope === 'series' && (
                                          <div className="text-xs text-amber-400 flex items-center gap-1">
                                                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                                                Changes will affect all future instances
                                          </div>
                                    )}
                              </div>




                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                          <Label htmlFor="edit-status" className="flex items-center gap-2">
                                                <Activity className="h-4 w-4" />
                                                Status
                                          </Label>
                                          <Select
                                                value={form.status}
                                                onValueChange={(value) => setForm({ ...form, status: value })}
                                          >
                                                <SelectTrigger id="edit-status">
                                                      <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                      <SelectItem value="scheduled">Scheduled</SelectItem>
                                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                                      <SelectItem value="completed">Completed</SelectItem>
                                                </SelectContent>
                                          </Select>
                                    </div>

                                    <div className="flex flex-col gap-3 justify-end pb-1">
                                          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                                                <Label htmlFor="edit-availability" className="cursor-pointer">Available</Label>
                                                <Switch
                                                      id="edit-availability"
                                                      checked={form.availability}
                                                      onCheckedChange={(c) => setForm({ ...form, availability: c })}
                                                      disabled={updateScope === 'instance'}
                                                      className="data-[state=checked]:bg-sky-500"
                                                />
                                          </div>
                                    </div>
                              </div>


                              <div className="space-y-2">
                                    <Label htmlFor="edit-title" className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          Title
                                    </Label>
                                    <Input
                                          id="edit-title"
                                          disabled={updateScope === 'instance'} // Assuming title change applies to series usually
                                          placeholder="Enter class title"
                                          value={form.title}
                                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                              </div>


                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                          <Label htmlFor="edit-start-time">Start Time</Label>
                                          <Input
                                                id="edit-start-time"
                                                type="time"
                                                value={form.startTime}
                                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                          />
                                    </div>
                                    <div className="space-y-2">
                                          <Label htmlFor="edit-end-time">End Time</Label>
                                          <Input
                                                id="edit-end-time"
                                                type="time"
                                                value={form.endTime}
                                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                          />
                                    </div>
                              </div>


                              <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <textarea
                                          id="edit-description"
                                          placeholder="Enter class description"
                                          value={form.description}
                                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                                          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                              </div>


                              <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                          <Label htmlFor="edit-instructor" className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Instructor
                                          </Label>
                                          <Input
                                                id="edit-instructor"
                                                placeholder="Instructor name"
                                                value={form.instructor}
                                                onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                                          />
                                    </div>
                                    <div className="space-y-2">
                                          <Label htmlFor="edit-location" className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                Location
                                          </Label>
                                          <Input
                                                id="edit-location"
                                                placeholder="Room/Location"
                                                value={form.location}
                                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                          />
                                    </div>
                              </div>


                              <div className="space-y-2">
                                    <Label htmlFor="edit-capacity" className="flex items-center gap-2">
                                          <Users className="h-4 w-4" />
                                          Capacity
                                    </Label>
                                    <Input
                                          id="edit-capacity"
                                          type="number"
                                          min={0}
                                          max={500}
                                          value={form.capacity || ""}
                                          onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === "") {
                                                      setForm({ ...form, capacity: 0 });
                                                } else {
                                                      const num = parseInt(value);
                                                      setForm({ ...form, capacity: isNaN(num) ? 0 : Math.max(0, num) });
                                                }
                                          }}
                                          className="w-32"
                                          placeholder="Enter capacity"
                                    />
                              </div>
                        </div>



                        <DialogFooter className="gap-2">
                              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                                    Cancel
                              </Button>
                              <Button
                                    variant="premium"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                              >
                                    {isLoading ? (
                                          <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                          </>
                                    ) : (
                                          updateScope === 'instance' ? "Update Instance" : "Update Series"
                                    )}
                              </Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog >
      )
}
