import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import { validateBookingIntakeRequest } from '../ai/bookingIntake'
import { getBookingIntakeProvider } from '../ai/bookingIntakeProvider'
import BookingIntakeAudit from '../models/BookingIntakeAudit'
import Booking from '../models/Booking'
import * as helper from '../utils/helper'

export const bookingIntake = async (req: Request, res: Response) => {
  const validationError = validateBookingIntakeRequest(req.body)
  if (validationError) {
    res.status(400).json({ message: validationError })
    return
  }

  const request = (req.body as { request: string }).request.trim()
  try {
    const provider = getBookingIntakeProvider()
    const extractedData = await provider.extract(request)
    if (!req.user?._id || !helper.isValidObjectId(req.user._id)) {
      res.status(401).json({ message: 'Unauthorized!' })
      return
    }
    const audit = await BookingIntakeAudit.create({
      userId: new mongoose.Types.ObjectId(req.user._id),
      originalRequest: request,
      extractedData,
      confidence: extractedData.confidence,
      missingFields: extractedData.missingFields,
      ambiguities: extractedData.ambiguities,
      approvalStatus: extractedData.missingFields.length || extractedData.ambiguities.length ? 'needs_correction' : 'extracted',
      provider: provider.name,
    })
    res.json({
      provider: provider.name,
      originalRequest: request,
      auditId: audit._id,
      extractedData,
    })
  } catch {
    res.status(503).json({ message: 'AI booking intake is temporarily unavailable.' })
  }
}

export const getAudits = async (req: Request, res: Response) => {
  const page = Number.parseInt(String(req.params.page), 10)
  const size = Number.parseInt(String(req.params.size), 10)
  if (!Number.isInteger(page) || !Number.isInteger(size) || page < 1 || size < 1 || size > 100) {
    res.status(400).json({ message: 'Invalid page or size' })
    return
  }
  const match: Record<string, unknown> = {}
  if (typeof req.query.status === 'string' && req.query.status.trim()) match.approvalStatus = req.query.status.trim()
  if (typeof req.query.bookingId === 'string' && helper.isValidObjectId(req.query.bookingId)) match.createdBookingId = new mongoose.Types.ObjectId(req.query.bookingId)
  if (typeof req.query.minConfidence === 'string' && !Number.isNaN(Number(req.query.minConfidence))) match.confidence = { $gte: Number(req.query.minConfidence) }
  const result = await BookingIntakeAudit.aggregate([
    { $match: match },
    { $sort: { createdAt: -1, _id: 1 } },
    {
      $facet: {
        resultData: [{ $skip: (page - 1) * size }, { $limit: size }],
        pageInfo: [{ $count: 'totalRecords' }],
      },
    },
  ])
  res.json(result)
}

export const approveAudit = async (req: Request, res: Response) => {
  const auditId = String(req.params.id)
  if (!helper.isValidObjectId(auditId)) {
    res.status(400).json({ message: 'Invalid audit ID' })
    return
  }
  const audit = await BookingIntakeAudit.findById(auditId)
  if (!audit) {
    res.status(404).json({ message: 'AI request not found' })
    return
  }
  if (!['extracted', 'needs_correction'].includes(audit.approvalStatus)) {
    res.status(409).json({ message: 'This AI request is not awaiting approval' })
    return
  }
  const correctedData = req.body?.correctedData
  if (!correctedData || typeof correctedData !== 'object') {
    res.status(400).json({ message: 'correctedData is required for approval' })
    return
  }
  const missingFields = Array.isArray(correctedData.missingFields) ? correctedData.missingFields : []
  if (missingFields.length > 0 || correctedData.requiresApproval !== true) {
    res.status(400).json({ message: 'Complete the required fields before approval' })
    return
  }
  if (!req.user?._id || !helper.isValidObjectId(req.user._id)) {
    res.status(401).json({ message: 'Unauthorized!' })
    return
  }
  audit.correctedData = correctedData
  audit.approvedBy = new mongoose.Types.ObjectId(req.user._id)
  audit.approvalStatus = 'approved'
  await audit.save()
  res.json(audit)
}

export const rejectAudit = async (req: Request, res: Response) => {
  const auditId = String(req.params.id)
  if (!helper.isValidObjectId(auditId)) {
    res.status(400).json({ message: 'Invalid audit ID' })
    return
  }
  const audit = await BookingIntakeAudit.findById(auditId)
  if (!audit) {
    res.status(404).json({ message: 'AI request not found' })
    return
  }
  if (!['extracted', 'needs_correction'].includes(audit.approvalStatus)) {
    res.status(409).json({ message: 'This AI request is not awaiting review' })
    return
  }
  audit.approvalStatus = 'rejected'
  audit.failureReason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Rejected by operator'
  await audit.save()
  res.json(audit)
}

export const markBookingCreated = async (req: Request, res: Response) => {
  const auditId = String(req.params.id)
  const bookingId = String(req.body?.bookingId || '')
  if (!helper.isValidObjectId(auditId) || !helper.isValidObjectId(bookingId)) {
    res.status(400).json({ message: 'Valid audit and booking IDs are required' })
    return
  }
  const booking = await Booking.findById(bookingId).select('_id')
  if (!booking) {
    res.status(404).json({ message: 'Booking not found' })
    return
  }
  const audit = await BookingIntakeAudit.findById(auditId)
  if (!audit) {
    res.status(404).json({ message: 'AI request not found' })
    return
  }
  if (audit.approvalStatus !== 'approved') {
    res.status(409).json({ message: 'AI request is not approved for booking linkage' })
    return
  }
  audit.createdBookingId = booking._id
  audit.approvalStatus = 'booking_created'
  await audit.save()
  res.json(audit)
}
