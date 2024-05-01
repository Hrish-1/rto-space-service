import auth from "../layers/authLayer.js";
import express from 'express'
import { getDeliveries } from "../services/deliveryService.js";
const router = express.Router()

router.get('', auth, getDeliveries)

export default router
