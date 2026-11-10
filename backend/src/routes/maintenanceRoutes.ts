import express from 'express'
import routeNames from '../config/maintenanceRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as maintenanceController from '../controllers/maintenanceController'

const routes = express.Router()

routes.post(routeNames.create, authJwt.verifyToken, authJwt.authSupplier, maintenanceController.create)
routes.get(routeNames.getByVehicle, authJwt.verifyToken, authJwt.authSupplier, maintenanceController.getByVehicle)
routes.put(routeNames.update, authJwt.verifyToken, authJwt.authSupplier, maintenanceController.update)

export default routes
