import mongoose from 'mongoose'
import type { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import Car from '../models/Car'
import Maintenance from '../models/Maintenance'
import * as helper from '../utils/helper'

export const create = async (req: Request, res: Response) => {
  const body = req.body as Partial<bookcarsTypes.Maintenance>
  if (!req.user?._id || !helper.isValidObjectId(req.user._id) || !helper.isValidObjectId(body.vehicle || '')) {
    res.status(400).json({ message: 'A valid vehicle is required' })
    return
  }
  const car = await Car.findById(body.vehicle).select('supplier')
  if (!car) {
    res.status(404).json({ message: 'Vehicle not found' })
    return
  }
  if (req.user.type !== bookcarsTypes.UserType.Admin && car.supplier.toString() !== req.user._id) {
    res.status(403).json({ message: 'Forbidden: Access denied' })
    return
  }
  const maintenance = await Maintenance.create({
    ...body,
    vehicle: car._id,
    supplier: car.supplier,
    reportedBy: new mongoose.Types.ObjectId(req.user._id),
  })
  res.status(201).json(maintenance)
}

export const getByVehicle = async (req: Request, res: Response) => {
  const vehicle = String(req.params.vehicle)
  if (!helper.isValidObjectId(vehicle)) {
    res.status(400).json({ message: 'Invalid vehicle ID' })
    return
  }
  const filter = req.user?.type === bookcarsTypes.UserType.Admin
    ? { vehicle }
    : { vehicle, supplier: req.user?._id }
  res.json(await Maintenance.find(filter).sort({ startDate: -1, _id: 1 }).lean())
}

export const update = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  if (!helper.isValidObjectId(id)) {
    res.status(400).json({ message: 'Invalid maintenance ID' })
    return
  }
  const record = await Maintenance.findById(id)
  if (!record) {
    res.status(404).json({ message: 'Maintenance record not found' })
    return
  }
  if (req.user?.type !== bookcarsTypes.UserType.Admin && record.supplier.toString() !== req.user?._id) {
    res.status(403).json({ message: 'Forbidden: Access denied' })
    return
  }
  const allowed = ['type', 'description', 'status', 'startDate', 'expectedCompletionDate', 'completedDate', 'mileage', 'cost', 'notes']
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      ;(record as unknown as Record<string, unknown>)[key] = req.body[key]
    }
  }
  await record.save()
  res.json(record)
}
