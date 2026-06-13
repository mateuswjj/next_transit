import { Box, Button, DialogActions, FormControlLabel, Switch, TextField } from '@mui/material'
import type { VehicleFormErrors, VehicleFormState } from '../types'

type VehicleFormFieldsProps = {
  form: VehicleFormState
  errors: VehicleFormErrors
  onChange: (field: keyof VehicleFormState, value: string | boolean) => void
  includeCurrentPosition: boolean
  submitLabel: string
  isSaving: boolean
  onCancel: () => void
}

function VehicleFormFields({
  form,
  errors,
  onChange,
  includeCurrentPosition,
  submitLabel,
  isSaving,
  onCancel,
}: VehicleFormFieldsProps) {
  return (
    <Box>
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
          error={!!errors.name}
          helperText={errors.name}
          slotProps={{ htmlInput: { maxLength: 255 } }}
          fullWidth
        />
        <TextField
          label="Plate"
          value={form.plate}
          onChange={(event) => onChange('plate', event.target.value)}
          error={!!errors.plate}
          helperText={errors.plate}
          slotProps={{ htmlInput: { maxLength: 20 } }}
          fullWidth
        />
        <TextField
          label="External ID"
          value={form.external_id}
          onChange={(event) => onChange('external_id', event.target.value)}
          error={!!errors.external_id}
          helperText={errors.external_id}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          fullWidth
        />
        <TextField
          label="Status"
          value={form.status}
          onChange={(event) => onChange('status', event.target.value)}
          error={!!errors.status}
          helperText={errors.status ?? 'Accepted: active, inactive, maintenance'}
          fullWidth
        />
        <TextField
          label="Speed"
          value={form.speed}
          onChange={(event) => onChange('speed', event.target.value)}
          error={!!errors.speed}
          helperText={errors.speed}
          fullWidth
        />
        <TextField
          label="Heading"
          value={form.heading}
          onChange={(event) => onChange('heading', event.target.value)}
          error={!!errors.heading}
          helperText={errors.heading}
          slotProps={{ htmlInput: { maxLength: 255 } }}
          fullWidth
        />
        {includeCurrentPosition ? (
          <TextField
            label="Current Position"
            value={form.current_position}
            onChange={(event) => onChange('current_position', event.target.value)}
            error={!!errors.current_position}
            helperText={errors.current_position}
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

export default VehicleFormFields
