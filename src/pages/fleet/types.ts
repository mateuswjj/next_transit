import type { ReactNode } from 'react'

export type Vehicle = {
  id: number
  name: string
  plate: string
  external_id: string
  is_active: boolean
  status: string
  current_position: string | Record<string, unknown> | null
  speed: number | string
  heading: string
  last_seen_at: string | null
}

export type VehicleFormState = {
  name: string
  plate: string
  external_id: string
  is_active: boolean
  status: string
  speed: string
  heading: string
  current_position: string
}

export type VehicleFormErrors = Partial<Record<keyof VehicleFormState, string>>

export type DetailItemProps = {
  label: string
  value: ReactNode
}
