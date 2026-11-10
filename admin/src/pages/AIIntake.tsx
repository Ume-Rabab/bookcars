import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as AIService from '@/services/AIService'
import * as helper from '@/utils/helper'

import '@/assets/css/ai-intake.css'

const AIIntake = () => {
  const navigate = useNavigate()
  const [request, setRequest] = useState('')
  const [audit, setAudit] = useState<bookcarsTypes.BookingIntakeAudit>()
  const [audits, setAudits] = useState<bookcarsTypes.BookingIntakeAudit[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [correctedData, setCorrectedData] = useState<bookcarsTypes.BookingIntakeData>()

  const loadLatest = useCallback(async () => {
    try {
      const data = await AIService.getAudits(1, 20)
      setAudits(data[0]?.resultData || [])
      const latest = data[0]?.resultData?.[0]
      setAudit(latest)
      setCorrectedData(latest?.correctedData || latest?.extractedData)
    } catch (error) {
      helper.error(error)
    }
  }, [])

  useEffect(() => {
    loadLatest()
  }, [loadLatest])

  const submit = async () => {
    if (!request.trim()) {
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const data = await AIService.extract(request)
      setMessage(`Request extracted. Audit ID: ${data.auditId}`)
      await loadLatest()
    } catch (error) {
      helper.error(error)
    } finally {
      setLoading(false)
    }
  }

  const approve = async () => {
    if (!audit || !correctedData) {
      return
    }
    try {
      const requiredFields: Array<keyof bookcarsTypes.BookingIntakeData> = ['pickupLocation', 'dropoffLocation', 'startDate', 'endDate']
      const missingFields = requiredFields.filter((field) => !correctedData[field])
      const approvalData = {
        ...correctedData,
        missingFields,
        ambiguities: [],
        requiresApproval: true as const,
      }
      if (missingFields.length > 0) {
        setMessage(`Complete these fields before approval: ${missingFields.join(', ')}`)
        return
      }
      const updated = await AIService.approveAudit(audit._id, approvalData)
      setAudit(updated)
      setMessage('Approved for normal booking workflow. Opening the booking form for final operator validation.')
      navigate('/create-booking', { state: { aiBookingData: approvalData, auditId: audit._id } })
    } catch (error) {
      helper.error(error)
    }
  }

  const reject = async () => {
    if (!audit) {
      return
    }
    try {
      const updated = await AIService.rejectAudit(audit._id, 'Rejected by operator during review')
      setAudit(updated)
      setMessage('AI request rejected and retained in the audit trail.')
    } catch (error) {
      helper.error(error)
    }
  }

  const updateField = <K extends keyof bookcarsTypes.BookingIntakeData>(field: K, value: bookcarsTypes.BookingIntakeData[K]) => {
    setCorrectedData((current) => current ? { ...current, [field]: value } : current)
  }

  return (
    <Layout admin strict>
      <div className="ai-intake">
        <Typography variant="h4">AI Booking Intake</Typography>
        <Typography color="text.secondary">Extract booking details, review them, and explicitly approve the corrected request.</Typography>
        <Card>
          <CardContent>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Customer request"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="I need a Corolla with driver from Lahore to Islamabad on 2026-11-15 for three days"
            />
            <Button className="btn-primary" variant="contained" onClick={submit} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Extract request'}
            </Button>
          </CardContent>
        </Card>
        {message && <Alert severity="info">{message}</Alert>}
        {audit && (
          <Card>
            <CardContent>
              <Typography variant="h6">AI request history</Typography>
              {audits.map((row) => (
                <Button
                  key={row._id}
                  variant={row._id === audit._id ? 'contained' : 'text'}
                  onClick={() => {
                    setAudit(row)
                    setCorrectedData(row.correctedData || row.extractedData)
                  }}
                  sx={{ mr: 1, mb: 1 }}
                >
                  {row.approvalStatus} · {new Date(row.createdAt).toLocaleDateString()}
                </Button>
              ))}
              <Typography variant="h6">Latest review</Typography>
              {correctedData && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <TextField fullWidth label="Pickup location" value={correctedData.pickupLocation || ''} onChange={(event) => updateField('pickupLocation', event.target.value || null)} />
                  </Box>
                  <Box>
                    <TextField fullWidth label="Drop-off location" value={correctedData.dropoffLocation || ''} onChange={(event) => updateField('dropoffLocation', event.target.value || null)} />
                  </Box>
                  <Box>
                    <TextField fullWidth label="Vehicle category" value={correctedData.vehicleCategory || ''} onChange={(event) => updateField('vehicleCategory', event.target.value || null)} />
                  </Box>
                  <Box>
                    <TextField fullWidth label="Rental type" value={correctedData.rentalType || ''} onChange={(event) => updateField('rentalType', event.target.value || null)} />
                  </Box>
                  <Box>
                    <TextField fullWidth type="date" label="Start date" InputLabelProps={{ shrink: true }} value={correctedData.startDate || ''} onChange={(event) => updateField('startDate', event.target.value || null)} />
                  </Box>
                  <Box>
                    <TextField fullWidth type="date" label="End date" InputLabelProps={{ shrink: true }} value={correctedData.endDate || ''} onChange={(event) => updateField('endDate', event.target.value || null)} />
                  </Box>
                </Box>
              )}
              <pre>{JSON.stringify({ ...audit.extractedData, correctedData }, null, 2)}</pre>
              <Typography>Status: {audit.approvalStatus}</Typography>
              {audit.approvalStatus !== 'approved' && audit.approvalStatus !== 'booking_created' && (
                <>
                  <Button className="btn-primary" variant="contained" onClick={approve}>Approve corrected data</Button>
                  <Button variant="outlined" color="error" onClick={reject}>Reject request</Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default AIIntake
