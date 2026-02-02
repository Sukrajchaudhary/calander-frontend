# Calendar & Time Slots Documentation

This document explains how the calendar system and time slots division work in the Class Scheduling Frontend.

---

## Table of Contents

1. [Calendar Overview](#calendar-overview)
2. [Time Slots Division](#time-slots-division)
3. [Calendar Components](#calendar-components)
4. [Recurring Classes](#recurring-classes)
5. [Event Types & Status](#event-types--status)
6. [API Integration](#api-integration)
7. [State Management](#state-management)
8. [Data Flow](#data-flow)

---

## Calendar Overview

The calendar system is built using React with TanStack Query for data fetching. It supports:
- **Day View**: Single day view with all events
- **Week View**: 7-day grid with time slots
- **Month View**: Month overview (placeholder for future implementation)
- **List View**: Tabular list of all classes

### Main Entry Point
[`ClassSchedule.tsx`](components/calendar/ClassSchedule.tsx) - Main container component managing:
- View state (calendar/list)
- Date navigation (day/week/month)
- Event filtering (all/scheduled/completed/cancelled)
- Search functionality
- Branch selection

---

## Time Slots Division

### Time Slot Configuration

The week view uses predefined time slots for organizing events:

```typescript
// WeekView.tsx (lines 16-23)
const TIME_SLOTS = [
  { label: "6 AM", hour: 6 },
  { label: "9 AM", hour: 9 },
  { label: "12 PM", hour: 12 },
  { label: "3 PM", hour: 15 },
  { label: "6 PM", hour: 18 },
  { label: "9 PM", hour: 21 },
];
```

### How Time Slots Work

1. **Slot Assignment**: Events are assigned to slots based on their start time
   - Event at 6 AM - 9 AM falls into the "6 AM" slot
   - Event at 10 AM falls into the "9 AM" slot (since 10 >= 9 and 10 < 12)

2. **Filtering Logic** ([`WeekView.tsx`](components/calendar/WeekView.tsx:29-50)):
   ```typescript
   const getEventsForSlot = (day: Date, slotHour: number, nextSlotHour: number) => {
     return events.filter((event) => {
       const eventHour = parseInt(event.startTime.split(":")[0], 10);
       const sameDay = isSameDay(eventDate, day);
       return sameDay && eventHour >= slotHour && eventHour < nextSlotHour;
     });
   };
   ```

3. **Grid Layout**: 
   - Each row represents a time slot
   - Each column represents a day of the week
   - Events within the same time slot are stacked vertically

### Time Slot in Form (Creating Classes)

When creating a class, time slots are defined as:

```typescript
// types/calendar.ts (lines 13-16)
export interface TimeSlot {
  startTime: string;  // HH:mm format (e.g., "09:00")
  endTime: string;    // HH:mm format (e.g., "10:00")
}
```

Multiple time slots can be added for recurring classes.

---

## Calendar Components

### 1. ClassSchedule ([`ClassSchedule.tsx`](components/calendar/ClassSchedule.tsx))

**State Management:**
```typescript
const [viewMode, setViewMode] = useState<ViewMode>("calendar");
const [dateViewMode, setDateViewMode] = useState<DateViewMode>("week");
const [currentDate, setCurrentDate] = useState(new Date());
const [eventFilter, setEventFilter] = useState<EventFilter>("all");
const [searchQuery, setSearchQuery] = useState("");
```

**Date Range Calculation:**
```typescript
const dateRange = useMemo(() => {
  if (dateViewMode === "week") {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return {
      start,
      end,
      startStr: format(start, "yyyy-MM-dd"),
      endStr: format(end, "yyyy-MM-dd"),
    };
  }
  // ... day and month views
}, [currentDate, dateViewMode]);
```

### 2. WeekView ([`WeekView.tsx`](components/calendar/WeekView.tsx))

**Key Features:**
- Renders a 7-day grid with time slots
- Displays events with status colors
- Shows event details (title, instructor, location, capacity)
- Highlights current day

**Status Colors:**
```typescript
const getStatusColor = (status: InstanceStatus | ClassStatus) => {
  switch (status) {
    case "completed": return "border-l-emerald-500";
    case "cancelled": return "border-l-red-500 opacity-60";
    case "scheduled":
    case "active":
    default: return "border-l-sky-500";
  }
};
```

### 3. CreateClassModal ([`CreateClassModal.tsx`](components/calendar/CreateClassModal.tsx))

**Form Structure:**
```typescript
const DEFAULT_FORM_STATE = {
  title: "",
  description: "",
  instructor: "",
  location: "",
  capacity: 20,
  isRecurring: false,
  // One-time fields
  scheduledDate: undefined,
  startTime: "09:00",
  endTime: "10:00",
  // Recurring fields
  recurrenceType: "weekly",
  recurrenceStartDate: undefined,
  recurrenceEndDate: undefined,
  // Time slots for each recurrence type
  dailyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }],
  weeklyDays: ["monday", "wednesday", "friday"],
  weeklyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }],
  monthlyDays: [1, 15],
  monthlyTimeSlots: [{ startTime: "09:00", endTime: "10:00" }],
  customDays: ["monday", "wednesday", "friday"],
  customInterval: 2,
  customTimeSlots: [{ startTime: "09:00", endTime: "10:00" }],
};
```

---

## Recurring Classes

The system supports four types of recurrence patterns:

### 1. Daily Recurrence
```typescript
interface DailyRecurrence {
  type: 'daily';
  startDate: string;  // ISO date string
  endDate?: string;   // Optional end date
  dailyTimeSlots: TimeSlot[];
}
```
- Class repeats every day
- Can specify multiple time slots per day

### 2. Weekly Recurrence
```typescript
interface WeeklyRecurrence {
  type: 'weekly';
  startDate: string;
  endDate?: string;
  weeklyDays: DayOfWeek[];  // e.g., ["monday", "wednesday", "friday"]
  weeklyTimeSlots: TimeSlot[];
}
```
- Class repeats on selected days each week
- Default: Monday, Wednesday, Friday

### 3. Monthly Recurrence
```typescript
interface MonthlyRecurrence {
  type: 'monthly';
  startDate: string;
  endDate?: string;
  monthlyDays: number[];    // Day of month (1-31)
  monthlyTimeSlots: TimeSlot[];
}
```
- Class repeats on specific days of each month
- Example: 1st and 15th of every month

### 4. Custom Recurrence
```typescript
interface CustomRecurrence {
  type: 'custom';
  startDate: string;
  endDate?: string;
  customDays: DayOfWeek[];
  customInterval: number;   // Every N weeks
  customTimeSlots: TimeSlot[];
}
```
- Class repeats every N weeks on selected days
- Example: Every 2 weeks on Monday and Friday

---

## Event Types & Status

### CalendarEvent Interface
```typescript
interface CalendarEvent {
  id: string;
  classId: string;
  type: 'one-time' | 'recurring-instance';
  title: string;
  description?: string;
  instructor?: string;
  location?: string;
  capacity?: number;
  bookedCount?: number;
  scheduledDate: string;  // ISO date string
  startTime: string;      // HH:mm format
  endTime: string;        // HH:mm format
  status: InstanceStatus | ClassStatus;
  isRecurring: boolean;
  recurrence?: RecurrenceConfig;
}
```

### Status Types
```typescript
// For individual instances (one-time or recurring instances)
type InstanceStatus = 'scheduled' | 'cancelled' | 'completed';

// For the class template itself
type ClassStatus = 'active' | 'cancelled' | 'completed';
```

### Status Display Mappings
```typescript
// In ClassSchedule.tsx (lines 160-161)
let displayStatus = item.status;
if (displayStatus === "active") displayStatus = "scheduled";
// API uses "active" but UI displays "scheduled"
```

---

## API Integration

### API Layer ([`useCalendarApi.ts`](hooks/useCalendarApi.ts))

**Query Keys:**
```typescript
export const queryKeys = {
  health: ['health'],
  classes: ['classes'],
  class: (id: string) => ['class', id],
  classInstances: (id: string) => ['classInstances', id],
  instances: (startDate: string, endDate: string) => ['instances', startDate, endDate],
  calendar: (startDate: string, endDate: string) => ['calendar', startDate, endDate],
};
```

**Main Hooks:**
| Hook | Purpose |
|------|---------|
| `useCalendarView()` | Fetches calendar events for date range |
| `useClasses()` | Fetches all classes with pagination |
| `useCreateClass()` | Creates a new class (one-time or recurring) |
| `useUpdateClass()` | Updates class details |
| `useUpdateInstanceStatus()` | Updates individual instance status |
| `useInstances()` | Fetches instances by date range |

### API Request Types

**Create One-Time Class:**
```typescript
interface CreateOneTimeClassRequest {
  title: string;
  description?: string;
  instructor?: string;
  location?: string;
  capacity?: number;
  isRecurring: false;
  scheduledDate: string;  // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm
}
```

**Create Recurring Class:**
```typescript
interface CreateRecurringClassRequest {
  title: string;
  description?: string;
  instructor?: string;
  location?: string;
  capacity?: number;
  isRecurring: true;
  recurrence: RecurrenceConfig;
}
```

---

## State Management

### Local State (ClassSchedule)
```typescript
// View state
const [viewMode, setViewMode] = useState<ViewMode>("calendar");
const [dateViewMode, setDateViewMode] = useState<DateViewMode>("week");

// Navigation state
const [currentDate, setCurrentDate] = useState(new Date());

// Filter state
const [eventFilter, setEventFilter] = useState<EventFilter>("all");
const [searchQuery, setSearchQuery] = useState("");

// Modal state
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
```

### Query State (TanStack Query)
```typescript
// Calendar data query
const {
  data: calendarData,
  isLoading: isLoadingCalendar,
  refetch: refetchCalendar,
} = useCalendarView({
  startDate: dateRange.startStr,
  endDate: dateRange.endStr,
  status: statusFilter,
});

// Classes query
const {
  data: classesData,
  isLoading: isLoadingClasses,
  refetch: refetchClasses,
} = useClasses({ ... });
```

---

## Data Flow

### 1. Loading Events

```
User navigates to calendar
         ↓
ClassSchedule calculates date range
         ↓
useCalendarView hook fetches data from API
         ↓
Events are transformed to CalendarEvent format
         ↓
Filtered by search query and status
         ↓
Passed to WeekView for rendering
```

### 2. Creating a Class

```
User clicks "Schedule Class" button
         ↓
CreateClassModal opens
         ↓
User fills form (one-time or recurring)
         ↓
handleSubmit creates CreateClassRequest
         ↓
useCreateClass mutation sends to API
         ↓
On success: invalidate queries and refetch
         ↓
Calendar refreshes with new event
```

### 3. Updating Event Status

```
User clicks on event
         ↓
Edit modal opens or status dropdown appears
         ↓
User changes status (scheduled/cancelled/completed)
         ↓
handleStatusChange calls useUpdateInstanceStatus
         ↓
API updates instance status
         ↓
Queries invalidated and calendar refetched
```

---

## Time Slot Calculation Example

For a week view showing events from Dec 2-8, 2024:

**Events:**
1. "Yoga Class" - Dec 4, 2024, 09:00-10:00
2. "Pilates Class" - Dec 4, 2024, 10:30-11:30
3. "Spin Class" - Dec 6, 2024, 18:00-19:00

**Slot Assignment:**
| Slot | Wednesday (Dec 4) | Friday (Dec 6) |
|------|-------------------|----------------|
| 6 AM | - | - |
| 9 AM | Yoga Class | - |
| 12 PM | - | - |
| 3 PM | - | - |
| 6 PM | - | Spin Class |
| 9 PM | - | - |

Note: "Yoga Class" at 9:00 falls into 9 AM slot, "Pilates Class" at 10:30 also falls into 9 AM slot (since 10:30 >= 9 and 10:30 < 12).

---

## Type Definitions Summary

All type definitions are located in [`types/calendar.ts`](types/calendar.ts):

| Category | Types |
|----------|-------|
| **Recurrence** | `RecurrenceType`, `DailyRecurrence`, `WeeklyRecurrence`, `MonthlyRecurrence`, `CustomRecurrence` |
| **Status** | `ClassStatus`, `InstanceStatus` |
| **Core Entities** | `Class`, `ClassInstance`, `CalendarEvent` |
| **API Requests** | `CreateClassRequest`, `UpdateClassRequest`, `UpdateInstanceRequest` |
| **API Responses** | `ApiResponse`, `PaginatedResponse`, `CreateClassResponse` |
| **UI State** | `ViewMode`, `DateViewMode`, `EventFilter`, `CreateClassFormState` |

---

## Additional Resources

- [date-fns Documentation](https://date-fns.org/) - Date manipulation library
- [TanStack Query Documentation](https://tanstack.com/query/latest) - Data fetching and caching
- [Lucide React](https://lucide.dev/) - Icon library used in the UI
