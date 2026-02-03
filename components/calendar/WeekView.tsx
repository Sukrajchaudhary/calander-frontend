"use client";
import { useMemo, useCallback } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type {
  CalendarEvent,
  InstanceStatus,
  ClassStatus,
} from "@/types/calendar";
import { User, MapPin, Users, Clock, XCircle, RefreshCcw, CheckCircle } from "lucide-react";


interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}
const TIME_SLOTS = [
  { label: "6 AM", hour: 6 },
  { label: "9 AM", hour: 9 },
  { label: "12 PM", hour: 12 },
  { label: "3 PM", hour: 15 },
  { label: "6 PM", hour: 18 },
  { label: "9 PM", hour: 21 },
];

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  // Optimize: Group events by O(1) lookup
  const eventsBySlot = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};
    const dayGroups: Record<string, CalendarEvent[]> = {}; // For day totals

    events.forEach(event => {
      try {
        // Parse date reliably
        const datePart = event.scheduledDate.split('T')[0];
        const eventDate = parseISO(event.scheduledDate.includes("T") ? event.scheduledDate : `${datePart}T00:00:00`);
        const dayKey = format(eventDate, "yyyy-MM-dd");

        if (!dayGroups[dayKey]) dayGroups[dayKey] = [];
        dayGroups[dayKey].push(event);

        const hour = parseInt(event.startTime.split(":")[0], 10);
        const slot = TIME_SLOTS.find((s, i) => {
          const nextHour = TIME_SLOTS[i + 1]?.hour || 24;
          return hour >= s.hour && hour < nextHour;
        });

        if (slot) {
          const key = `${dayKey}-${slot.hour}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(event);
        }
      } catch (e) {
        console.warn("Failed to parse event date", event);
      }
    });
    return { slots: groups, days: dayGroups };
  }, [events]);

  const getEventsForDay = useCallback((day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    return eventsBySlot.days[key] || [];
  }, [eventsBySlot]);

  return (
    <div className="flex flex-col">
      {/* Header Row */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-4" /> {/* Empty corner */}
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="p-4 text-center border-l border-border bg-card/20">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-2xl font-bold mt-1 transition-colors",
                  isToday ? "text-sky-500 scale-110 origin-center" : "text-foreground",
                )}
              >
                {format(day, "d")}
              </div>
              {dayEvents.length > 0 && (
                <div className="text-[10px] font-medium text-muted-foreground mt-1.5 px-2 py-0.5 rounded-full bg-muted/50 inline-block">
                  {dayEvents.length} class{dayEvents.length !== 1 ? "es" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time Slot Rows */}
      {TIME_SLOTS.map((slot) => (
        <div key={slot.label} className="grid grid-cols-8 border-b border-border last:border-0 hover:bg-muted/5 transition-colors">
          {/* Time Label */}
          <div className="p-4 text-sm text-muted-foreground font-medium flex items-start pt-6 bg-muted/10">
            {slot.label}
          </div>

          {/* Day Cells */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const slotKey = `${dayKey}-${slot.hour}`;
            const slotEvents = eventsBySlot.slots[slotKey] || [];

            return (
              <div key={slotKey} className="p-2 border-l border-border min-h-[120px]">
                <div className="space-y-2 h-full">
                  {slotEvents.map((event) => (
                    <WeekEventCard
                      key={event.id}
                      event={event}
                      onClick={() => onEventClick?.(event)}
                    />
                  ))}
                  {/* Empty state placeholder for interactivity if needed later */}
                  {slotEvents.length === 0 && (
                    <div className="h-full w-full rounded-lg hover:bg-muted/20 transition-colors" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {events.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <div className="p-4 rounded-full bg-muted/30">
            <Clock className="w-8 h-8 opacity-50" />
          </div>
          <p className="font-medium">No classes scheduled for this week</p>
        </div>
      )}
    </div>
  );
}

// Extracted Sub-component for Cleaner Structure
const WeekEventCard = ({ event, onClick }: { event: CalendarEvent; onClick?: () => void }) => {
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const isUnavailable = event.availability === false;
  const isAvailable = !isUnavailable && !isCancelled && !isCompleted;

  // memoize status color
  const statusColor = (() => {
    if (isCompleted) return "border-l-emerald-500 bg-emerald-50/5";
    if (isCancelled) return "border-l-red-500 opacity-60 bg-red-50/5";
    if (isUnavailable) return "border-l-rose-500 bg-rose-50/5 dark:bg-rose-950/10";
    return "border-l-sky-500 bg-card/60";
  })();

  return (
    <div
      onClick={onClick}
      className={cn(
        "group p-3 rounded-lg border-l-[3px] cursor-pointer relative overflow-hidden shadow-sm transition-all duration-300",
        "hover:shadow-md hover:translate-x-0.5",
        statusColor,
        isAvailable && "hover:border-l-sky-400 hover:ring-1 hover:ring-sky-500/20"
      )}
    >
      {/* Availability Ripple/Glow Effect */}
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/0 via-sky-500/5 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}

      {/* Badges */}
      <div className="flex gap-1 absolute top-2 right-2 z-10">
        {isCancelled && <Badge color="red" icon={XCircle} label="CANCELLED" />}
        {isCompleted && <Badge color="green" icon={CheckCircle} label="DONE" />}
        {isUnavailable && !isCancelled && <Badge color="rose" icon={XCircle} label="UNAVAILABLE" />}
      </div>

      <div className="relative z-10 pr-2">
        {/* Time */}
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">
          <Clock className="h-3 w-3" />
          <span>{event.startTime} - {event.endTime}</span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-0.5 mb-2">
          <span
            className={cn(
              "font-semibold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors line-clamp-2",
              isCancelled && "line-through text-muted-foreground"
            )}
          >
            {event.title}
          </span>
          {event.isRecurring && (
            <div className="flex items-center gap-1 text-[10px] text-amber-500/80 font-medium">
              <RefreshCcw className="h-2.5 w-2.5" />
              <span>Recurring Series</span>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="space-y-1">
          {event.instructor && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.instructor}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.capacity !== undefined && (
            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/50 text-xs text-muted-foreground/80">
              <Users className="h-3 w-3 shrink-0 text-sky-500/70" />
              <span className="font-medium text-sky-600/90 dark:text-sky-400">
                {event.bookedCount || 0} / {event.capacity}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ color, icon: Icon, label }: { color: "red" | "green" | "rose", icon: any, label: string }) => {
  const colors = {
    red: "bg-red-500 text-white",
    green: "bg-emerald-500 text-white",
    rose: "bg-rose-500 text-white"
  }
  return (
    <div className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-sm", colors[color])}>
      <Icon className="h-2 w-2" />
      {label}
    </div>
  )
}
