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

function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <section className="dashboard-panel fleet-panel" aria-label="Fleet page">
      <div className="fleet-panel__header">
        <div>
          <h1 className="fleet-panel__title">Fleet</h1>
          <p className="fleet-panel__subtitle">Vehicles returned by the backend API.</p>
        </div>
      </div>

      {isLoading ? <p className="fleet-panel__state">Loading fleet...</p> : null}

      {error ? (
        <p className="fleet-panel__state fleet-panel__state--error">
          Could not load fleet data. {error}
        </p>
      ) : null}

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="fleet-panel__state">No vehicles were returned by the backend.</p>
        )
      ) : null}
    </section>
  )
}

export default FleetPage
