import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Typography } from '@mui/material'
import type { DetailItemProps, Vehicle } from '../types'

type ViewVehicleModalProps = {
  open: boolean
  vehicle: Vehicle | null
  onClose: () => void
  formatPosition: (position: Vehicle['current_position']) => string
  formatLastSeen: (lastSeenAt: Vehicle['last_seen_at']) => string
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Paper>
  )
}

function ViewVehicleModal({
  open,
  vehicle,
  onClose,
  formatPosition,
  formatLastSeen,
}: ViewVehicleModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Vehicle details</DialogTitle>
      <DialogContent dividers>
        {vehicle ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <DetailItem label="ID" value={vehicle.id} />
            <DetailItem label="Name" value={vehicle.name} />
            <DetailItem label="Plate" value={vehicle.plate} />
            <DetailItem label="External ID" value={vehicle.external_id} />
            <DetailItem label="Active" value={vehicle.is_active ? 'Yes' : 'No'} />
            <DetailItem label="Status" value={vehicle.status} />
            <DetailItem label="Position" value={formatPosition(vehicle.current_position)} />
            <DetailItem label="Speed" value={vehicle.speed} />
            <DetailItem label="Heading" value={vehicle.heading} />
            <DetailItem label="Last Seen" value={formatLastSeen(vehicle.last_seen_at)} />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewVehicleModal
