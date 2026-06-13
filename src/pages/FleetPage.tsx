import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddVehicleModal from './fleet/modals/AddVehicleModal'
import EditVehicleModal from './fleet/modals/EditVehicleModal'
import ViewVehicleModal from './fleet/modals/ViewVehicleModal'
import type { Vehicle, VehicleFormErrors, VehicleFormState } from './fleet/types'

type ToastState = {
  open: boolean
  message: string
  severity: 'success' | 'error' | 'info'
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const VALID_STATUSES = new Set(['active', 'inactive', 'maintenance'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeApiErrorMessage(errorData: unknown) {
  if (typeof errorData === 'string') {
    return errorData
  }

  if (Array.isArray(errorData)) {
    return errorData.map((item) => String(item)).join(' ')
  }

  if (isRecord(errorData)) {
    if (typeof errorData.error === 'string') {
      return errorData.error
    }

    const entries = Object.entries(errorData).flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${field}: ${String(item)}`)
      }

      if (typeof value === 'string') {
        return [`${field}: ${value}`]
      }

      return []
    })

    if (entries.length > 0) {
      return entries.join(' ')
    }
  }

  return 'The request failed.'
}

function mapApiErrorsToForm(errorData: unknown): VehicleFormErrors {
  if (!isRecord(errorData)) {
    return {}
  }

  const fieldNames: Array<keyof VehicleFormState> = [
    'name',
    'plate',
    'external_id',
    'is_active',
    'status',
    'speed',
    'heading',
    'current_position',
  ]

  return fieldNames.reduce<VehicleFormErrors>((acc, field) => {
    const value = errorData[field]

    if (Array.isArray(value) && value.length > 0) {
      acc[field] = String(value[0])
    } else if (typeof value === 'string') {
      acc[field] = value
    }

    return acc
  }, {})
}

function formatPosition(position: Vehicle['current_position']) {
  if (!position) {
    return '-'
  }

  if (typeof position === 'string') {
    return position
  }

  return JSON.stringify(position)
}

function formatLastSeen(lastSeenAt: Vehicle['last_seen_at']) {
  if (!lastSeenAt) {
    return '-'
  }

  const date = new Date(lastSeenAt)

  if (Number.isNaN(date.getTime())) {
    return lastSeenAt
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function createEmptyForm(): VehicleFormState {
  return {
    name: '',
    plate: '',
    external_id: '',
    is_active: true,
    status: 'active',
    speed: '0',
    heading: '',
    current_position: '',
  }
}

function createEditForm(vehicle: Vehicle): VehicleFormState {
  return {
    name: vehicle.name,
    plate: vehicle.plate,
    external_id: vehicle.external_id,
    is_active: vehicle.is_active,
    status: vehicle.status,
    speed: String(vehicle.speed),
    heading: vehicle.heading,
    current_position:
      typeof vehicle.current_position === 'string'
        ? vehicle.current_position
        : vehicle.current_position
          ? JSON.stringify(vehicle.current_position)
          : '',
  }
}

function validateVehicleForm(
  form: VehicleFormState,
  options: { includeCurrentPosition: boolean },
): VehicleFormErrors {
  const errors: VehicleFormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Name is required.'
  } else if (form.name.trim().length > 255) {
    errors.name = 'Name must be at most 255 characters.'
  }

  if (!form.plate.trim()) {
    errors.plate = 'Plate is required.'
  } else if (form.plate.trim().length > 20) {
    errors.plate = 'Plate must be at most 20 characters.'
  }

  if (!form.external_id.trim()) {
    errors.external_id = 'External ID is required.'
  } else if (form.external_id.trim().length > 100) {
    errors.external_id = 'External ID must be at most 100 characters.'
  }

  if (!form.status.trim()) {
    errors.status = 'Status is required.'
  } else if (!VALID_STATUSES.has(form.status.trim().toLowerCase())) {
    errors.status = 'Status must be active, inactive, or maintenance.'
  }

  if (!form.speed.trim()) {
    errors.speed = 'Speed is required.'
  } else if (!/^-?\d+(\.\d{1,2})?$/.test(form.speed.trim())) {
    errors.speed = 'Speed must be a valid number with up to 2 decimals.'
  }

  if (!form.heading.trim()) {
    errors.heading = 'Heading is required.'
  } else if (form.heading.trim().length > 255) {
    errors.heading = 'Heading must be at most 255 characters.'
  }

  if (options.includeCurrentPosition && !form.current_position.trim()) {
    errors.current_position = 'Current position is required for editing.'
  }

  return errors
}

function validateVehicleField(
  field: keyof VehicleFormState,
  form: VehicleFormState,
  options: { includeCurrentPosition: boolean },
) {
  return validateVehicleForm(form, options)[field]
}

function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState | null>(null)
  const [formErrors, setFormErrors] = useState<VehicleFormErrors>({})
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  })

  useEffect(() => {
    let isMounted = true

    async function loadVehicles() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`${API_BASE_URL}/vehicles/`)

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: Vehicle[] = await response.json()

        if (isMounted) {
          setVehicles(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load vehicles from the backend.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadVehicles()

    return () => {
      isMounted = false
    }
  }, [])

  function updateFormField(field: keyof VehicleFormState, value: string | boolean) {
    const includeCurrentPosition = isEditModalOpen

    setVehicleForm((current) => {
      if (!current) {
        return current
      }

      const nextForm = { ...current, [field]: value }
      const nextError = validateVehicleField(field, nextForm, { includeCurrentPosition })

      setFormErrors((currentErrors) => {
        if (!nextError && !currentErrors[field]) {
          return currentErrors
        }

        const nextErrors = { ...currentErrors }

        if (nextError) {
          nextErrors[field] = nextError
          return nextErrors
        }

        delete nextErrors[field]
        return nextErrors
      })

      return nextForm
    })
  }

  function openToast(message: string, severity: ToastState['severity']) {
    setToast({
      open: true,
      message,
      severity,
    })
  }

  function openViewModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setIsViewModalOpen(true)
  }

  function openAddModal() {
    setSelectedVehicle(null)
    setVehicleForm(createEmptyForm())
    setFormErrors({})
    setIsAddModalOpen(true)
  }

  function openEditModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setVehicleForm(createEditForm(vehicle))
    setFormErrors({})
    setIsEditModalOpen(true)
  }

  function closeModals() {
    setIsViewModalOpen(false)
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedVehicle(null)
    setVehicleForm(null)
    setFormErrors({})
  }

  async function handleDelete(vehicle: Vehicle) {
    const shouldDelete = window.confirm(`Delete vehicle "${vehicle.name}"?`)

    if (!shouldDelete) {
      return
    }

    try {
      setIsDeletingId(vehicle.id)

      const response = await fetch(`${API_BASE_URL}/vehicle/${vehicle.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`)
      }

      setVehicles((currentVehicles) =>
        currentVehicles.filter((currentVehicle) => currentVehicle.id !== vehicle.id),
      )
      openToast(`Vehicle "${vehicle.name}" deleted successfully.`, 'success')
    } catch (deleteError) {
      openToast(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete vehicle.',
        'error',
      )
    } finally {
      setIsDeletingId(null)
    }
  }

  async function handleAddSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!vehicleForm) {
      return
    }

    const nextErrors = validateVehicleForm(vehicleForm, { includeCurrentPosition: false })

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    try {
      setIsSaving(true)
      setFormErrors({})

      const response = await fetch(`${API_BASE_URL}/vehicles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: vehicleForm.name,
          plate: vehicleForm.plate,
          external_id: vehicleForm.external_id,
          is_active: vehicleForm.is_active,
          status: vehicleForm.status,
          speed: vehicleForm.speed,
          heading: vehicleForm.heading,
        }),
      })

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null)
        setFormErrors(mapApiErrorsToForm(errorData))
        throw new Error(normalizeApiErrorMessage(errorData) || `Create failed with status ${response.status}`)
      }

      const createdVehicle: Vehicle = await response.json()

      setVehicles((currentVehicles) => [createdVehicle, ...currentVehicles])
      closeModals()
      openToast(`Vehicle "${createdVehicle.name}" created successfully.`, 'success')
    } catch (createError) {
      openToast(
        createError instanceof Error ? createError.message : 'Unable to create vehicle.',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedVehicle || !vehicleForm) {
      return
    }

    const nextErrors = validateVehicleForm(vehicleForm, { includeCurrentPosition: true })

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    try {
      setIsSaving(true)
      setFormErrors({})

      const response = await fetch(`${API_BASE_URL}/vehicle/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: vehicleForm.name,
          plate: vehicleForm.plate,
          external_id: vehicleForm.external_id,
          is_active: vehicleForm.is_active,
          status: vehicleForm.status,
          speed: vehicleForm.speed,
          heading: vehicleForm.heading,
          current_position: vehicleForm.current_position,
        }),
      })

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null)
        setFormErrors(mapApiErrorsToForm(errorData))
        throw new Error(normalizeApiErrorMessage(errorData) || `Update failed with status ${response.status}`)
      }

      const updatedVehicle: Vehicle = await response.json()

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
        ),
      )
      closeModals()
      openToast(`Vehicle "${updatedVehicle.name}" updated successfully.`, 'success')
    } catch (updateError) {
      openToast(
        updateError instanceof Error ? updateError.message : 'Unable to update vehicle.',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="dashboard-panel fleet-panel" aria-label="Fleet page">
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'flex-start' },
          }}
        >
          <Box>
            <Typography variant="h4" color="text.primary">
              Fleet
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vehicles returned by the backend API.
            </Typography>
          </Box>
          <Button variant="contained" onClick={openAddModal}>
            Add vehicle
          </Button>
        </Stack>

        {isLoading ? <Alert severity="info">Loading fleet...</Alert> : null}
        {error ? <Alert severity="error">Could not load fleet data. {error}</Alert> : null}

        {!isLoading && !error ? (
          vehicles.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 4 }}>
              <Table sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Plate</TableCell>
                    <TableCell>External ID</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Speed</TableCell>
                    <TableCell>Heading</TableCell>
                    <TableCell>Last Seen</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>{vehicle.id}</TableCell>
                      <TableCell>{vehicle.name}</TableCell>
                      <TableCell>{vehicle.plate}</TableCell>
                      <TableCell>{vehicle.external_id}</TableCell>
                      <TableCell>{vehicle.is_active ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{vehicle.status}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>{formatPosition(vehicle.current_position)}</TableCell>
                      <TableCell>{vehicle.speed}</TableCell>
                      <TableCell>{vehicle.heading}</TableCell>
                      <TableCell>{formatLastSeen(vehicle.last_seen_at)}</TableCell>
                      <TableCell align="right">
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          sx={{ justifyContent: 'flex-end' }}
                        >
                          <Button size="small" variant="outlined" onClick={() => openViewModal(vehicle)}>
                            View
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => openEditModal(vehicle)}>
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDelete(vehicle)}
                            disabled={isDeletingId === vehicle.id}
                          >
                            {isDeletingId === vehicle.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No vehicles were returned by the backend.</Alert>
          )
        ) : null}
      </Stack>

      <ViewVehicleModal
        open={isViewModalOpen && !!selectedVehicle}
        vehicle={selectedVehicle}
        onClose={closeModals}
        formatPosition={formatPosition}
        formatLastSeen={formatLastSeen}
      />

      <AddVehicleModal
        open={isAddModalOpen && !!vehicleForm}
        form={vehicleForm}
        errors={formErrors}
        isSaving={isSaving}
        onClose={closeModals}
        onSubmit={handleAddSubmit}
        onChange={updateFormField}
      />

      <EditVehicleModal
        open={isEditModalOpen && !!selectedVehicle && !!vehicleForm}
        vehicle={selectedVehicle}
        form={vehicleForm}
        errors={formErrors}
        isSaving={isSaving}
        onClose={closeModals}
        onSubmit={handleEditSubmit}
        onChange={updateFormField}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </section>
  )
}

export default FleetPage
