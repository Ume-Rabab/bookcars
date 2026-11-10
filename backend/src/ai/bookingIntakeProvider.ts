import { extractBookingIntake, BookingIntakeData } from './bookingIntake'

export interface BookingIntakeProvider {
  name: string
  extract: (request: string) => Promise<BookingIntakeData>
}

const mockProvider: BookingIntakeProvider = {
  name: 'mock',
  extract: async (request) => extractBookingIntake(request),
}

export const getBookingIntakeProvider = (): BookingIntakeProvider => {
  const provider = (process.env.BC_AI_PROVIDER || 'mock').trim().toLowerCase()
  if (provider === 'mock') {
    return mockProvider
  }
  throw new Error(`Unsupported AI provider: ${provider}`)
}
