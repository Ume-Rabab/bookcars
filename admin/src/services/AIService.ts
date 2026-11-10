import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'
import env from '@/config/env.config'

export interface BookingIntakeResponse {
  provider: string
  originalRequest: string
  auditId: string
  extractedData: bookcarsTypes.BookingIntakeData
}

export const extract = (request: string): Promise<BookingIntakeResponse> =>
  axiosInstance.post('/api/ai/booking-intake', { request }, { withCredentials: true }).then((res) => res.data)

export const getAudits = (page: number, size = env.PAGE_SIZE): Promise<Array<{ resultData: bookcarsTypes.BookingIntakeAudit[], pageInfo: { totalRecords: number }[] }>> =>
  axiosInstance.get(`/api/ai/booking-intake-audits/${page}/${size}`, { withCredentials: true }).then((res) => res.data)

export const approveAudit = (id: string, correctedData: bookcarsTypes.BookingIntakeData): Promise<bookcarsTypes.BookingIntakeAudit> =>
  axiosInstance.post(`/api/ai/booking-intake-audits/${encodeURIComponent(id)}/approve`, { correctedData }, { withCredentials: true }).then((res) => res.data)
