import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as AIService from '@/services/AIService'
import * as helper from '@/utils/helper'

import '@/assets/css/ai-intake.css'

const AIIntake = () => {
  const [request, setRequest] = useState('')
  const [audit, setAudit] = useState<bookcarsTypes.BookingIntakeAudit>()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadLatest = useCallback(async () => {
    try {
      const data = await AIService.getAudits(1, 1)
      setAudit(data[0]?.resultData?.[0])
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
    if (!audit) {
      return
    }
    try {
      const correctedData = { ...audit.extractedData, missingFields: [], ambiguities: [], requiresApproval: true as const }
      const updated = await AIService.approveAudit(audit._id, correctedData)
      setAudit(updated)
      setMessage('Approved for normal booking workflow. No booking was created automatically.')
    } catch (error) {
      helper.error(error)
    }
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
              <Typography variant="h6">Latest review</Typography>
              <pre>{JSON.stringify(audit.extractedData, null, 2)}</pre>
              <Typography>Status: {audit.approvalStatus}</Typography>
              {audit.approvalStatus !== 'approved' && audit.approvalStatus !== 'booking_created' && (
                <Button className="btn-primary" variant="contained" onClick={approve}>Approve corrected data</Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

export default AIIntake
