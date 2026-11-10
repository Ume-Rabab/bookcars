import type { Request, Response } from 'express'
import { validateBookingIntakeRequest } from '../ai/bookingIntake'
import { getBookingIntakeProvider } from '../ai/bookingIntakeProvider'

export const bookingIntake = async (req: Request, res: Response) => {
  const validationError = validateBookingIntakeRequest(req.body)
  if (validationError) {
    res.status(400).json({ message: validationError })
    return
  }

  const request = (req.body as { request: string }).request.trim()
  try {
    const provider = getBookingIntakeProvider()
    res.json({
      provider: provider.name,
      originalRequest: request,
      extractedData: await provider.extract(request),
    })
  } catch {
    res.status(503).json({ message: 'AI booking intake is temporarily unavailable.' })
  }
}
