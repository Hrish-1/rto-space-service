import express from 'express';
import auth from '../layers/authLayer.js';
import { getInvoices, patchInvoice } from '../services/invoiceService.js';
const router = express.Router();

router.get('', auth, getInvoices)
router.patch('/:id', auth, patchInvoice)

export default router;
