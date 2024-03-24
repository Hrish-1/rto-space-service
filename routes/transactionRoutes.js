import express from 'express';
const router = express.Router();
import { createEntry } from '../services/transactionService.js';

// Define the route for creating a new entry
router.post('/entry', createEntry);

export default  router
