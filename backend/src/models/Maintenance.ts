import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

const maintenanceSchema = new Schema<env.Maintenance>(
  {
    vehicle: { type: Schema.Types.ObjectId, required: true, ref: 'Car', index: true },
    reportedBy: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    supplier: { type: Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'oil_change', 'tire_service', 'engine_service', 'registration_renewal',
        'insurance_renewal', 'fitness_renewal', 'accident_repair', 'general_inspection',
      ] satisfies bookcarsTypes.MaintenanceType[],
    },
    description: { type: String, maxlength: 2000 },
    status: {
      type: String,
      required: true,
      enum: ['reported', 'scheduled', 'in_progress', 'completed', 'cancelled'] satisfies bookcarsTypes.MaintenanceStatus[],
      default: 'reported',
      index: true,
    },
    startDate: { type: Date, required: true },
    expectedCompletionDate: { type: Date, required: true },
    completedDate: { type: Date },
    mileage: { type: Number, min: 0 },
    cost: { type: Number, min: 0 },
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true, strict: true, collection: 'Maintenance' },
)

maintenanceSchema.path('expectedCompletionDate').validate(function (value: Date) {
  return !this.startDate || value >= this.startDate
}, 'completion date cannot precede start date')

maintenanceSchema.path('completedDate').validate(function (value: Date | undefined) {
  return this.status !== 'completed' || Boolean(value)
}, 'completed date is required when completed')

maintenanceSchema.index({ vehicle: 1, status: 1, startDate: 1, expectedCompletionDate: 1 })

export default model<env.Maintenance>('Maintenance', maintenanceSchema)
