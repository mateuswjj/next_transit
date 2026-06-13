import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

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
      <div className="fleet-panel__header">
        <div>
          <h1 className="fleet-panel__title">Fleet</h1>
          <p className="fleet-panel__subtitle">Vehicles returned by the backend API.</p>
        </div>
        <button type="button" className="fleet-action fleet-action--edit" onClick={openAddModal}>
          Add vehicle
        </button>
      </div>

      {isLoading ? <p className="fleet-panel__state">Loading fleet...</p> : null}

      {error ? (
        <p className="fleet-panel__state fleet-panel__state--error">
          Could not load fleet data. {error}
        </p>
      ) : null}

      {actionMessage ? <p className="fleet-panel__state">{actionMessage}</p> : null}

      {!isLoading && !error ? (
        vehicles.length > 0 ? (
          <div className="fleet-table-wrap">
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Plate</th>
                  <th>External ID</th>
                  <th>Active</th>
                  <th>Status</th>
                  <th>Position</th>
                  <th>Speed</th>
                  <th>Heading</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.id}</td>
                    <td>{vehicle.name}</td>
                    <td>{vehicle.plate}</td>
                    <td>{vehicle.external_id}</td>
                    <td>{vehicle.is_active ? 'Yes' : 'No'}</td>
                    <td>{vehicle.status}</td>
                    <td>{formatPosition(vehicle.current_position)}</td>
                    <td>{vehicle.speed}</td>
                    <td>{vehicle.heading}</td>
                    <td>{formatLastSeen(vehicle.last_seen_at)}</td>
                    <td>
                      <div className="fleet-actions">
                        <button
                          type="button"
                          className="fleet-action fleet-action--view"
                          onClick={() => openViewModal(vehicle)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="fleet-action fleet-action--edit"
                          onClick={() => openEditModal(vehicle)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="fleet-action fleet-action--delete"
                          onClick={() => handleDelete(vehicle)}
                          disabled={isDeletingId === vehicle.id}
                        >
                          {isDeletingId === vehicle.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="fleet-panel__state">No vehicles were returned by the backend.</p>
        )
      ) : null}

      {isViewModalOpen && selectedVehicle ? (
        <div className="fleet-modal-backdrop" role="presentation" onClick={closeModals}>
          <div
            className="fleet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fleet-view-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fleet-modal__header">
              <h2 id="fleet-view-title" className="fleet-modal__title">
                Vehicle details
              </h2>
              <button type="button" className="fleet-modal__close" onClick={closeModals}>
                Close
              </button>
            </div>
            <dl className="fleet-details">
              <div>
                <dt>ID</dt>
                <dd>{selectedVehicle.id}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{selectedVehicle.name}</dd>
              </div>
              <div>
                <dt>Plate</dt>
                <dd>{selectedVehicle.plate}</dd>
              </div>
              <div>
                <dt>External ID</dt>
                <dd>{selectedVehicle.external_id}</dd>
              </div>
              <div>
                <dt>Active</dt>
                <dd>{selectedVehicle.is_active ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selectedVehicle.status}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{formatPosition(selectedVehicle.current_position)}</dd>
              </div>
              <div>
                <dt>Speed</dt>
                <dd>{selectedVehicle.speed}</dd>
              </div>
              <div>
                <dt>Heading</dt>
                <dd>{selectedVehicle.heading}</dd>
              </div>
              <div>
                <dt>Last Seen</dt>
                <dd>{formatLastSeen(selectedVehicle.last_seen_at)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      {isAddModalOpen && vehicleForm ? (
        <div className="fleet-modal-backdrop" role="presentation" onClick={closeModals}>
          <div
            className="fleet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fleet-add-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fleet-modal__header">
              <h2 id="fleet-add-title" className="fleet-modal__title">
                Add vehicle
              </h2>
              <button type="button" className="fleet-modal__close" onClick={closeModals}>
                Close
              </button>
            </div>
            <form className="fleet-form" onSubmit={handleAddSubmit}>
              <label>
                <span>Name</span>
                <input
                  value={vehicleForm.name}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Plate</span>
                <input
                  value={vehicleForm.plate}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, plate: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>External ID</span>
                <input
                  value={vehicleForm.external_id}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, external_id: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <input
                  value={vehicleForm.status}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, status: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Speed</span>
                <input
                  value={vehicleForm.speed}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, speed: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Heading</span>
                <input
                  value={vehicleForm.heading}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, heading: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="fleet-form__checkbox">
                <input
                  type="checkbox"
                  checked={vehicleForm.is_active}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, is_active: event.target.checked } : current,
                    )
                  }
                />
                <span>Active</span>
              </label>
              <div className="fleet-form__actions">
                <button type="button" className="fleet-action fleet-action--view" onClick={closeModals}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fleet-action fleet-action--edit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditModalOpen && selectedVehicle && vehicleForm ? (
        <div className="fleet-modal-backdrop" role="presentation" onClick={closeModals}>
          <div
            className="fleet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fleet-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fleet-modal__header">
              <h2 id="fleet-edit-title" className="fleet-modal__title">
                Edit vehicle
              </h2>
              <button type="button" className="fleet-modal__close" onClick={closeModals}>
                Close
              </button>
            </div>
            <form className="fleet-form" onSubmit={handleEditSubmit}>
              <label>
                <span>Name</span>
                <input
                  value={vehicleForm.name}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Plate</span>
                <input
                  value={vehicleForm.plate}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, plate: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>External ID</span>
                <input
                  value={vehicleForm.external_id}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, external_id: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <input
                  value={vehicleForm.status}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, status: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Speed</span>
                <input
                  value={vehicleForm.speed}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, speed: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label>
                <span>Heading</span>
                <input
                  value={vehicleForm.heading}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, heading: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="fleet-form__full">
                <span>Current Position</span>
                <input
                  value={vehicleForm.current_position}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, current_position: event.target.value } : current,
                    )
                  }
                />
              </label>
              <label className="fleet-form__checkbox">
                <input
                  type="checkbox"
                  checked={vehicleForm.is_active}
                  onChange={(event) =>
                    setVehicleForm((current) =>
                      current ? { ...current, is_active: event.target.checked } : current,
                    )
                  }
                />
                <span>Active</span>
              </label>
              <div className="fleet-form__actions">
                <button type="button" className="fleet-action fleet-action--view" onClick={closeModals}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fleet-action fleet-action--edit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default FleetPage
