import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

type Vehicle = {
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

type VehicleFormState = {
  name: string
  plate: string
  external_id: string
  is_active: boolean
  status: string
  speed: string
  heading: string
  current_position: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

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

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Paper>
  )
}

type VehicleFormProps = {
  form: VehicleFormState
  onChange: (field: keyof VehicleFormState, value: string | boolean) => void
  includeCurrentPosition: boolean
  submitLabel: string
  isSaving: boolean
  onCancel: () => void
}

function VehicleForm({
  form,
  onChange,
  includeCurrentPosition,
  submitLabel,
  isSaving,
  onCancel,
}: VehicleFormProps) {
  return (
    <Box component="form" onSubmit={(event) => event.preventDefault()}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          pt: 1,
        }}
      >
        <TextField
          label="Name"
          value={form.name}
          onChange={(event) => onChange('name', event.target.value)}
          fullWidth
        />
        <TextField
          label="Plate"
          value={form.plate}
          onChange={(event) => onChange('plate', event.target.value)}
          fullWidth
        />
        <TextField
          label="External ID"
          value={form.external_id}
          onChange={(event) => onChange('external_id', event.target.value)}
          fullWidth
        />
        <TextField
          label="Status"
          value={form.status}
          onChange={(event) => onChange('status', event.target.value)}
          fullWidth
        />
        <TextField
          label="Speed"
          value={form.speed}
          onChange={(event) => onChange('speed', event.target.value)}
          fullWidth
        />
        <TextField
          label="Heading"
          value={form.heading}
          onChange={(event) => onChange('heading', event.target.value)}
          fullWidth
        />
        {includeCurrentPosition ? (
          <TextField
            label="Current Position"
            value={form.current_position}
            onChange={(event) => onChange('current_position', event.target.value)}
            fullWidth
            sx={{ gridColumn: { md: '1 / -1' } }}
          />
        ) : null}
        <FormControlLabel
          control={
            <Switch
              checked={form.is_active}
              onChange={(event) => onChange('is_active', event.target.checked)}
            />
          }
          label="Active"
          sx={{ gridColumn: { md: '1 / -1' } }}
        />
      </Box>
      <DialogActions sx={{ px: 0, pt: 3 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSaving}>
          {isSaving ? 'Saving...' : submitLabel}
        </Button>
      </DialogActions>
    </Box>
  )
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
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

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
    setVehicleForm((current) => (current ? { ...current, [field]: value } : current))
  }

  function openViewModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setIsViewModalOpen(true)
    setActionMessage(null)
  }

  function openAddModal() {
    setSelectedVehicle(null)
    setVehicleForm(createEmptyForm())
    setIsAddModalOpen(true)
    setActionMessage(null)
  }

  function openEditModal(vehicle: Vehicle) {
    setSelectedVehicle(vehicle)
    setVehicleForm(createEditForm(vehicle))
    setIsEditModalOpen(true)
    setActionMessage(null)
  }

  function closeModals() {
    setIsViewModalOpen(false)
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedVehicle(null)
    setVehicleForm(null)
    setActionMessage(null)
  }

  async function handleDelete(vehicle: Vehicle) {
    const shouldDelete = window.confirm(`Delete vehicle "${vehicle.name}"?`)

    if (!shouldDelete) {
      return
    }

    try {
      setActionMessage(null)
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
    } catch (deleteError) {
      setActionMessage(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete vehicle.',
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

    try {
      setActionMessage(null)
      setIsSaving(true)

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
        throw new Error(`Create failed with status ${response.status}`)
      }

      const createdVehicle: Vehicle = await response.json()

      setVehicles((currentVehicles) => [createdVehicle, ...currentVehicles])
      closeModals()
      setActionMessage(`Vehicle "${createdVehicle.name}" created successfully.`)
    } catch (createError) {
      setActionMessage(
        createError instanceof Error ? createError.message : 'Unable to create vehicle.',
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

    try {
      setActionMessage(null)
      setIsSaving(true)

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
        throw new Error(`Update failed with status ${response.status}`)
      }

      const updatedVehicle: Vehicle = await response.json()

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle,
        ),
      )
      closeModals()
      setActionMessage(`Vehicle "${updatedVehicle.name}" updated successfully.`)
    } catch (updateError) {
      setActionMessage(
        updateError instanceof Error ? updateError.message : 'Unable to update vehicle.',
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
        {actionMessage ? <Alert severity="success">{actionMessage}</Alert> : null}

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

      <Dialog open={isViewModalOpen && !!selectedVehicle} onClose={closeModals} fullWidth maxWidth="md">
        <DialogTitle>Vehicle details</DialogTitle>
        <DialogContent dividers>
          {selectedVehicle ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <DetailItem label="ID" value={selectedVehicle.id} />
              <DetailItem label="Name" value={selectedVehicle.name} />
              <DetailItem label="Plate" value={selectedVehicle.plate} />
              <DetailItem label="External ID" value={selectedVehicle.external_id} />
              <DetailItem label="Active" value={selectedVehicle.is_active ? 'Yes' : 'No'} />
              <DetailItem label="Status" value={selectedVehicle.status} />
              <DetailItem label="Position" value={formatPosition(selectedVehicle.current_position)} />
              <DetailItem label="Speed" value={selectedVehicle.speed} />
              <DetailItem label="Heading" value={selectedVehicle.heading} />
              <DetailItem label="Last Seen" value={formatLastSeen(selectedVehicle.last_seen_at)} />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModals}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isAddModalOpen && !!vehicleForm} onClose={closeModals} fullWidth maxWidth="md">
        <DialogTitle>Add vehicle</DialogTitle>
        <DialogContent dividers>
          {vehicleForm ? (
            <Box component="form" onSubmit={handleAddSubmit}>
              <VehicleForm
                form={vehicleForm}
                onChange={updateFormField}
                includeCurrentPosition={false}
                submitLabel="Create"
                isSaving={isSaving}
                onCancel={closeModals}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen && !!selectedVehicle && !!vehicleForm} onClose={closeModals} fullWidth maxWidth="md">
        <DialogTitle>Edit vehicle</DialogTitle>
        <DialogContent dividers>
          {vehicleForm ? (
            <Box component="form" onSubmit={handleEditSubmit}>
              <VehicleForm
                form={vehicleForm}
                onChange={updateFormField}
                includeCurrentPosition
                submitLabel="Save"
                isSaving={isSaving}
                onCancel={closeModals}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default FleetPage
