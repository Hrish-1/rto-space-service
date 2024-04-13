import express from 'express';
import auth from '../layers/authLayer.js';
import { getInvoices } from '../services/invoiceService.js';
const router = express.Router();

router.get('', auth, getInvoices)

export default router;
