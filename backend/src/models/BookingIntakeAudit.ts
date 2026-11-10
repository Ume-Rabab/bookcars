import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

const bookingIntakeAuditSchema = new Schema<env.BookingIntakeAudit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    originalRequest: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    extractedData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    correctedData: {
      type: Schema.Types.Mixed,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    missingFields: {
      type: [String],
      default: [],
    },
    ambiguities: {
      type: [String],
      default: [],
    },
    approvalStatus: {
      type: String,
      enum: [
        'extracted',
        'needs_correction',
        'approved',
        'rejected',
        'booking_created',
        'failed',
      ] satisfies bookcarsTypes.BookingIntakeAuditStatus[],
      default: 'extracted',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
    provider: {
      type: String,
      required: true,
      maxlength: 100,
    },
    failureReason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'BookingIntakeAudit',
  },
)

bookingIntakeAuditSchema.index({ approvalStatus: 1, createdAt: -1 })
bookingIntakeAuditSchema.index({ userId: 1, createdAt: -1 })

export default model<env.BookingIntakeAudit>('BookingIntakeAudit', bookingIntakeAuditSchema)
