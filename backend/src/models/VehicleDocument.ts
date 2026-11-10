import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

const vehicleDocumentSchema = new Schema<env.VehicleDocument>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Car', index: true },
    driver: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    type: {
      type: String,
      required: true,
      enum: ['registration', 'insurance', 'token_tax', 'fitness_certificate', 'driver_license'] satisfies bookcarsTypes.VehicleDocumentType[],
    },
    expiryDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'verified', 'expired'] satisfies bookcarsTypes.VehicleDocumentStatus[],
      default: 'pending',
    },
    notes: { type: String, maxlength: 1000 },
  },
  { timestamps: true, strict: true, collection: 'VehicleDocument' },
)

vehicleDocumentSchema.pre('validate', function () {
  if (!this.vehicle && !this.driver) {
    this.invalidate('vehicle', 'vehicle or driver is required')
  }
  if (this.expiryDate < new Date() && this.status !== 'expired') {
    this.status = 'expired'
  }
})

vehicleDocumentSchema.index({ vehicle: 1, type: 1 }, { unique: true, partialFilterExpression: { vehicle: { $exists: true } } })
vehicleDocumentSchema.index({ driver: 1, type: 1 }, { unique: true, partialFilterExpression: { driver: { $exists: true } } })

export default model<env.VehicleDocument>('VehicleDocument', vehicleDocumentSchema)
