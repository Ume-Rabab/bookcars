import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

export const get = (): Promise<bookcarsTypes.OperationsDashboard> =>
  axiosInstance.get('/api/operations-dashboard', { withCredentials: true }).then((res) => res.data)
