import { addDays, isValidIsoDate } from '../src/ai/bookingIntakeDate'
import { extractBookingIntake, validateBookingIntakeRequest } from '../src/ai/bookingIntake'
import { getBookingIntakeProvider } from '../src/ai/bookingIntakeProvider'

describe('AI booking intake', () => {
  it('extracts a complete dated chauffeur request without creating a booking', () => {
    const result = extractBookingIntake('I need a Corolla with driver from Lahore to Islamabad on 2026-11-15 for three days')
    expect(result.rentalType).toBe('chauffeur')
    expect(result.chauffeurRequired).toBe(true)
    expect(result.pickupLocation).toBe('Lahore')
    expect(result.dropoffLocation).toBe('Islamabad')
    expect(result.startDate).toBe('2026-11-15')
    expect(result.endDate).toBe('2026-11-18')
    expect(result.missingFields).toEqual([])
    expect(result.requiresApproval).toBe(true)
  })

  it('requires clarification when the date year is not supplied', () => {
    const result = extractBookingIntake('Corolla with driver from Lahore to Islamabad on 15 November for three days')
    expect(result.missingFields).toEqual(expect.arrayContaining(['startDate', 'endDate']))
    expect(result.ambiguities).toContain('dateYear')
  })

  it('rejects malformed or oversized input', () => {
    expect(validateBookingIntakeRequest({})).toBe('request must be a string')
    expect(validateBookingIntakeRequest({ request: ' ' })).toBe('request must not be empty')
    expect(validateBookingIntakeRequest({ request: 'x'.repeat(2001) })).toBe('request must be 2000 characters or fewer')
  })

  it('validates date helpers', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(addDays('2026-11-15', 3)).toBe('2026-11-18')
  })

  it('uses the deterministic mock provider by default', async () => {
    delete process.env.BC_AI_PROVIDER
    const provider = getBookingIntakeProvider()
    expect(provider.name).toBe('mock')
    await expect(provider.extract('self-drive from Lahore to Islamabad on 2026-11-15 for two days')).resolves.toMatchObject({
      rentalType: 'self-drive',
      requiresApproval: true,
    })
  })
})
