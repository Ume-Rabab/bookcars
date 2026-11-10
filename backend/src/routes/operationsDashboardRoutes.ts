import express from 'express'
import routeNames from '../config/operationsDashboardRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as operationsDashboardController from '../controllers/operationsDashboardController'

const routes = express.Router()

routes.get(routeNames.get, authJwt.verifyToken, authJwt.authAdmin, operationsDashboardController.get)

export default routes
