import express from 'express';
const router = express.Router();
import { createEntry, getEntry,updateEntry } from '../services/transactionService.js';

// Define the route for creating a new entry
router.post('/entry', createEntry);
router.get('/entry', getEntry);
router.put('/entry', updateEntry);

export default  router
