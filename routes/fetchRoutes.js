import express from 'express';
const router = express.Router();
import { fetchBanks, fetchCustomers, fetchRto, fetchService} from '../services/fetchService.js';
import auth from '../layers/authLayer.js';

router.get('/banks',auth, fetchBanks);
router.get('/rtos',auth, fetchRto);
router.get('/services',auth, fetchService);
router.get('/customers', auth, fetchCustomers);

export default  router
