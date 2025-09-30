// src/types/event.ts
export interface Event {
  id: number
  event_name: string
  event_date: string
  slug: string
  target_checkins: number
  description?: string
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  created_by?: string
}

export interface EventStats {
  event_id: number
  event_name: string
  total_checkins: number
  target_checkins: number
  completion_percentage: number
  today_checkins: number
}

export interface CreateEventData {
  event_name: string
  event_date: string
  target_checkins: number
  description?: string
}

export interface UpdateEventData {
  event_name?: string
  event_date?: string
  target_checkins?: number
  description?: string
  status?: 'active' | 'completed' | 'cancelled'
}