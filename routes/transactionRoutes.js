import express from 'express';
const router = express.Router();
import {
  createTransaction,
  deleteTransaction,
  generateInvoicePdf,
  getTransactions,
  updateTransaction,
  updateStatus,
  generateDeliveryPdf
} from '../services/transactionService.js';
import auth from '../layers/authLayer.js';

router.post('', auth, createTransaction);
router.patch('/status', auth, updateStatus)
router.put('/:id', auth, updateTransaction);
router.post('/pdf', auth, generateInvoicePdf);
router.post('/deliverypdf', auth, generateDeliveryPdf);
router.delete('/:id', auth, deleteTransaction)
router.get('', auth, getTransactions)

export default router
