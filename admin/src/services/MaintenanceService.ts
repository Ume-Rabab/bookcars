import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

export const getByVehicle = (vehicle: string): Promise<bookcarsTypes.Maintenance[]> =>
  axiosInstance.get(`/api/maintenance/vehicle/${encodeURIComponent(vehicle)}`, { withCredentials: true }).then((res) => res.data)

export const create = (data: Omit<bookcarsTypes.Maintenance, '_id' | 'createdAt' | 'updatedAt' | 'reportedBy' | 'supplier'>): Promise<bookcarsTypes.Maintenance> =>
  axiosInstance.post('/api/maintenance', data, { withCredentials: true }).then((res) => res.data)
