import express from 'express'
import authJwt from '../middlewares/authJwt'
import { createRateLimiter } from '../middlewares/rateLimiter'
import * as aiController from '../controllers/aiController'

const routes = express.Router()

routes.post('/api/ai/booking-intake', createRateLimiter('ai-booking-intake'), authJwt.verifyToken, authJwt.authSupplier, aiController.bookingIntake)

export default routes
