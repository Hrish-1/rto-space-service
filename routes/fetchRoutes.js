import express from 'express';
const router = express.Router();
import { fetchBanks, fetchRto, fetchService} from '../services/fetchService.js';
import auth from '../layers/authLayer.js';

// Define the route for creating a new entry
router.get('/banks',auth, fetchBanks);
router.get('/rtos',auth, fetchRto);
router.get('/services',auth, fetchService);

export default  router
