import type { Request, Response } from 'express'
import Booking from '../models/Booking'
import Car from '../models/Car'
import Maintenance from '../models/Maintenance'
import VehicleDocument from '../models/VehicleDocument'
import BookingIntakeAudit from '../models/BookingIntakeAudit'
import * as bookcarsTypes from ':bookcars-types'

export const get = async (_req: Request, res: Response) => {
  const now = new Date()
  const soon = new Date(now)
  soon.setUTCDate(soon.getUTCDate() + 30)
  const activeStatuses = [
    bookcarsTypes.BookingStatus.Pending,
    bookcarsTypes.BookingStatus.Deposit,
    bookcarsTypes.BookingStatus.Paid,
    bookcarsTypes.BookingStatus.PaidInFull,
    bookcarsTypes.BookingStatus.Reserved,
  ]

  const [
    totalVehicles,
    availableVehicles,
    activeBookings,
    chauffeurBookings,
    airportBookings,
    maintenanceVehicles,
    upcomingMaintenance,
    expiredDocuments,
    expiringDocuments,
    pendingAiApprovals,
    approvedAiBookings,
    revenue,
    bookingStatuses,
    rentalTypes,
  ] = await Promise.all([
    Car.countDocuments(),
    Car.countDocuments({ available: true, fullyBooked: false }),
    Booking.countDocuments({ status: { $in: activeStatuses } }),
    BookingIntakeAudit.countDocuments({ 'extractedData.rentalType': 'chauffeur', approvalStatus: 'booking_created' }),
    BookingIntakeAudit.countDocuments({ 'extractedData.rentalType': 'airport-transfer', approvalStatus: 'booking_created' }),
    Maintenance.distinct('vehicle', { status: { $nin: ['completed', 'cancelled'] } }).then((vehicles) => vehicles.length),
    Maintenance.countDocuments({ startDate: { $gte: now }, status: { $nin: ['completed', 'cancelled'] } }),
    VehicleDocument.countDocuments({ expiryDate: { $lt: now } }),
    VehicleDocument.countDocuments({ expiryDate: { $gte: now, $lte: soon } }),
    BookingIntakeAudit.countDocuments({ approvalStatus: { $in: ['extracted', 'needs_correction'] } }),
    BookingIntakeAudit.countDocuments({ approvalStatus: 'booking_created' }),
    Booking.aggregate([
      { $match: { status: { $nin: [bookcarsTypes.BookingStatus.Void, bookcarsTypes.BookingStatus.Cancelled] } } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]).then((rows) => rows[0]?.total || 0),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    BookingIntakeAudit.aggregate([
      { $match: { approvalStatus: 'booking_created' } },
      { $group: { _id: '$extractedData.rentalType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ])

  res.json({
    generatedAt: now,
    totals: {
      totalVehicles,
      availableVehicles,
      activeBookings,
      chauffeurBookings,
      airportBookings,
      maintenanceVehicles,
      upcomingMaintenance,
      expiredDocuments,
      expiringDocuments,
      pendingAiApprovals,
      approvedAiBookings,
      revenue,
    },
    bookingStatuses,
    rentalTypes,
  })
}
