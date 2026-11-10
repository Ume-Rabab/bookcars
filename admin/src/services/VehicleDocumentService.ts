import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

export const getByVehicle = (vehicle: string): Promise<bookcarsTypes.VehicleDocument[]> =>
  axiosInstance.get(`/api/vehicle-documents/vehicle/${encodeURIComponent(vehicle)}`, { withCredentials: true }).then((res) => res.data)

export const upsert = (data: bookcarsTypes.VehicleDocument): Promise<bookcarsTypes.VehicleDocument> =>
  axiosInstance.put('/api/vehicle-documents', data, { withCredentials: true }).then((res) => res.data)
