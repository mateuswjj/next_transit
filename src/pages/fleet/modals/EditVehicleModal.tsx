import type { FormEvent } from 'react'
import { Box, Dialog, DialogContent, DialogTitle } from '@mui/material'
import VehicleFormFields from './VehicleFormFields'
import type { Vehicle, VehicleFormErrors, VehicleFormState } from '../types'

type EditVehicleModalProps = {
  open: boolean
  vehicle: Vehicle | null
  form: VehicleFormState | null
  errors: VehicleFormErrors
  isSaving: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof VehicleFormState, value: string | boolean) => void
}

function EditVehicleModal({
  open,
  vehicle,
  form,
  errors,
  isSaving,
  onClose,
  onSubmit,
  onChange,
}: EditVehicleModalProps) {
  return (
    <Dialog open={open && !!vehicle && !!form} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit vehicle</DialogTitle>
      <DialogContent dividers>
        {form ? (
          <Box component="form" onSubmit={onSubmit} noValidate>
            <VehicleFormFields
              form={form}
              errors={errors}
              onChange={onChange}
              includeCurrentPosition
              submitLabel="Save"
              isSaving={isSaving}
              onCancel={onClose}
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default EditVehicleModal
