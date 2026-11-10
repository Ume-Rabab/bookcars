import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import Car from '../models/Car'
import VehicleDocument from '../models/VehicleDocument'
import * as helper from '../utils/helper'

export const upsert = async (req: Request, res: Response) => {
  const body = req.body as bookcarsTypes.VehicleDocument
  if (!body || !helper.isValidObjectId(body.vehicle || '') || !body.type || !body.expiryDate) {
    res.status(400).json({ message: 'vehicle, type, and expiryDate are required' })
    return
  }
  const car = await Car.findById(body.vehicle).select('supplier')
  if (!car) {
    res.status(404).json({ message: 'Vehicle not found' })
    return
  }
  if (req.user?.type !== bookcarsTypes.UserType.Admin && car.supplier.toString() !== req.user?._id) {
    res.status(403).json({ message: 'Forbidden: Access denied' })
    return
  }
  const expiryDate = new Date(body.expiryDate)
  if (Number.isNaN(expiryDate.getTime())) {
    res.status(400).json({ message: 'Invalid expiryDate' })
    return
  }
  const status = expiryDate < new Date() ? 'expired' : body.status || 'pending'
  const document = await VehicleDocument.findOneAndUpdate(
    { vehicle: new mongoose.Types.ObjectId(body.vehicle), type: body.type },
    { vehicle: car._id, type: body.type, expiryDate, status, notes: body.notes },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  )
  res.json(document)
}

export const getByVehicle = async (req: Request, res: Response) => {
  const vehicle = String(req.params.vehicle)
  if (!helper.isValidObjectId(vehicle)) {
    res.status(400).json({ message: 'Invalid vehicle ID' })
    return
  }
  const car = await Car.findById(vehicle).select('supplier')
  if (!car) {
    res.status(404).json({ message: 'Vehicle not found' })
    return
  }
  if (req.user?.type !== bookcarsTypes.UserType.Admin && car.supplier.toString() !== req.user?._id) {
    res.status(403).json({ message: 'Forbidden: Access denied' })
    return
  }
  const documents = await VehicleDocument.find({ vehicle }).sort({ expiryDate: 1, _id: 1 }).lean()
  res.json(documents)
}

export const getExpiring = async (req: Request, res: Response) => {
  const days = Number.parseInt(String(req.query.days || '30'), 10)
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    res.status(400).json({ message: 'days must be between 1 and 365' })
    return
  }
  const now = new Date()
  const limit = new Date(now)
  limit.setUTCDate(limit.getUTCDate() + days)
  const documents = await VehicleDocument.find({
    expiryDate: { $lte: limit },
  }).sort({ expiryDate: 1, _id: 1 }).lean()
  res.json(documents)
}
