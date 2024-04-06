import express from 'express';
const router = express.Router();
import { createEntry, generatepdf, getEntry,updateEntry } from '../services/transactionService.js';
import auth from '../layers/authLayer.js';

// Define the route for creating a new entry
router.post('/entry',auth, createEntry);
router.get('/entry',auth, getEntry);
router.put('/entry',auth, updateEntry);
router.post('/pdf',auth, generatepdf);

export default  router
