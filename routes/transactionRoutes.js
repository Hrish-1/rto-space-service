import express from 'express';
const router = express.Router();
import { createTransaction, deleteTransaction, generatepdf, getTransactions, updateTransaction, updateStatus } from '../services/transactionService.js';
import auth from '../layers/authLayer.js';

router.post('', auth, createTransaction);
router.patch('/status', auth, updateStatus)
router.put('/:id', auth, updateTransaction);
router.post('/pdf', auth, generatepdf);
router.delete('/:id', auth, deleteTransaction)
router.get('', auth, getTransactions)

export default  router
