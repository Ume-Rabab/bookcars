import React, { useEffect, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as OperationsDashboardService from '@/services/OperationsDashboardService'
import * as helper from '@/utils/helper'

const OperationsDashboard = () => {
  const [data, setData] = useState<bookcarsTypes.OperationsDashboard>()
  const [error, setError] = useState(false)

  useEffect(() => {
    OperationsDashboardService.get().then(setData).catch((reason) => {
      setError(true)
      helper.error(reason)
    })
  }, [])

  const cards = data ? [
    ['Vehicles', data.totals.totalVehicles],
    ['Available vehicles', data.totals.availableVehicles],
    ['Active bookings', data.totals.activeBookings],
    ['Vehicles in maintenance', data.totals.maintenanceVehicles],
    ['Documents expired', data.totals.expiredDocuments],
    ['Documents expiring soon', data.totals.expiringDocuments],
    ['Pending AI approvals', data.totals.pendingAiApprovals],
    ['AI bookings created', data.totals.approvedAiBookings],
  ] : []

  return (
    <Layout admin strict>
      <div className="maintenance-page">
        <Typography variant="h4">Operations dashboard</Typography>
        <Typography color="text.secondary">Live fleet, booking, maintenance, document, and AI workflow metrics.</Typography>
        {error && <Alert severity="error">Unable to load operations metrics.</Alert>}
        {!data && !error && <CircularProgress />}
        {data && (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {cards.map(([label, value]) => <Card key={label as string}><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4">{value}</Typography></CardContent></Card>)}
            </Box>
            <Card><CardContent>
              <Typography variant="h6">PKR revenue recorded</Typography>
              <Typography variant="h4">PKR {data.totals.revenue.toLocaleString()}</Typography>
              <Typography color="text.secondary">Calculated from non-void, non-cancelled bookings.</Typography>
            </CardContent></Card>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
              <Card><CardContent><Typography variant="h6">Booking statuses</Typography>{data.bookingStatuses.map((row) => <Typography key={row._id}>{row._id}: {row.count}</Typography>)}</CardContent></Card>
              <Card><CardContent><Typography variant="h6">AI rental types</Typography>{data.rentalTypes.length === 0 && <Typography color="text.secondary">No AI-created bookings recorded.</Typography>}{data.rentalTypes.map((row) => <Typography key={row._id}>{row._id || 'unspecified'}: {row.count}</Typography>)}</CardContent></Card>
            </Box>
          </>
        )}
      </div>
    </Layout>
  )
}

export default OperationsDashboard
