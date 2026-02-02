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
import type { CalendarEvent, UpdateClassRequest, ClassStatus } from "@/types/calendar"
import { Calendar, User, MapPin, Users, Clock, FileText, Loader2 } from "lucide-react"

interface EditClassModalProps {
      isOpen: boolean
      onClose: () => void
      onSubmit: (id: string, data: UpdateClassRequest) => void
      event: CalendarEvent | null
      isLoading?: boolean
}

export function EditClassModal({
      isOpen,
      onClose,
      onSubmit,
      event,
      isLoading = false,
}: EditClassModalProps) {
      const [form, setForm] = useState({
            title: "",
            description: "",
            instructor: "",
            location: "",
            capacity: 20,
      })

      // Reset form when event changes
      useEffect(() => {
            if (event) {
                  setForm({
                        title: event.title || "",
                        description: event.description || "",
                        instructor: event.instructor || "",
                        location: event.location || "",
                        capacity: event.capacity || 20,
                  })
            }
      }, [event])

      const handleSubmit = () => {
            if (!event) return

            const updateData: UpdateClassRequest = {}

            // Only include changed fields
            if (form.title !== event.title) updateData.title = form.title
            if (form.description !== event.description) updateData.description = form.description
            if (form.instructor !== event.instructor) updateData.instructor = form.instructor
            if (form.location !== event.location) updateData.location = form.location
            if (form.capacity !== event.capacity) updateData.capacity = form.capacity

            // Check if any field was changed
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
                  <DialogContent className="sm:max-w-[500px] bg-card border-border">
                        <DialogHeader>
                              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-sky-400" />
                                    Edit Class
                              </DialogTitle>
                              <DialogDescription className="text-muted-foreground">
                                    Update the class details below.
                              </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                              {/* Class Info - Read Only */}
                              <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">Scheduled:</span>
                                          <span className="font-medium">
                                                {format(new Date(event.scheduledDate), "EEE, MMM d, yyyy")} at {event.startTime} - {event.endTime}
                                          </span>
                                    </div>
                                    {event.isRecurring && (
                                          <div className="text-xs text-amber-400 flex items-center gap-1">
                                                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                                                This is a recurring class
                                          </div>
                                    )}
                              </div>

                              {/* Title */}
                              <div className="space-y-2">
                                    <Label htmlFor="edit-title" className="flex items-center gap-2">
                                          <FileText className="h-4 w-4" />
                                          Class Title
                                    </Label>
                                    <Input
                                          id="edit-title"
                                          placeholder="Enter class title"
                                          value={form.title}
                                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    />
                              </div>

                              {/* Description */}
                              <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <textarea
                                          id="edit-description"
                                          placeholder="Enter class description (optional)"
                                          value={form.description}
                                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                                          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                              </div>

                              {/* Instructor & Location */}
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

                              {/* Capacity */}
                              <div className="space-y-2">
                                    <Label htmlFor="edit-capacity" className="flex items-center gap-2">
                                          <Users className="h-4 w-4" />
                                          Capacity
                                    </Label>
                                    <Input
                                          id="edit-capacity"
                                          type="number"
                                          min={1}
                                          max={500}
                                          value={form.capacity}
                                          onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })}
                                          className="w-32"
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
                                    disabled={isLoading || !form.title.trim()}
                              >
                                    {isLoading ? (
                                          <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                          </>
                                    ) : (
                                          "Save Changes"
                                    )}
                              </Button>
                        </DialogFooter>
                  </DialogContent>
            </Dialog>
      )
}
