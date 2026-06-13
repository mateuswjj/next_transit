import type { FormEvent } from 'react'
import { Box, Dialog, DialogContent, DialogTitle } from '@mui/material'
import VehicleFormFields from './VehicleFormFields'
import type { VehicleFormErrors, VehicleFormState } from '../types'

type AddVehicleModalProps = {
  open: boolean
  form: VehicleFormState | null
  errors: VehicleFormErrors
  isSaving: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onChange: (field: keyof VehicleFormState, value: string | boolean) => void
}

function AddVehicleModal({
  open,
  form,
  errors,
  isSaving,
  onClose,
  onSubmit,
  onChange,
}: AddVehicleModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Add vehicle</DialogTitle>
      <DialogContent dividers>
        {form ? (
          <Box component="form" onSubmit={onSubmit} noValidate>
            <VehicleFormFields
              form={form}
              errors={errors}
              onChange={onChange}
              includeCurrentPosition={false}
              submitLabel="Create"
              isSaving={isSaving}
              onCancel={onClose}
            />
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default AddVehicleModal
