import express from 'express'
import routeNames from '../config/vehicleDocumentRoutes.config'
import authJwt from '../middlewares/authJwt'
import * as vehicleDocumentController from '../controllers/vehicleDocumentController'

const routes = express.Router()

routes.put(routeNames.upsert, authJwt.verifyToken, authJwt.authSupplier, vehicleDocumentController.upsert)
routes.get(routeNames.getByVehicle, authJwt.verifyToken, authJwt.authSupplier, vehicleDocumentController.getByVehicle)
routes.get(routeNames.getExpiring, authJwt.verifyToken, authJwt.authAdmin, vehicleDocumentController.getExpiring)

export default routes
