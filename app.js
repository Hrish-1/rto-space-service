import express from 'express'
const app = express()
import bodyParser from 'body-parser';
import cors from 'cors'; // from cors
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';dotenv.config();
const port = process.env.PORT || 3000
import connectDB from './config/db.js';
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // JSON Middleware
connectDB()
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import  authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactionRoutes.js';

app.use('/api', authRoutes); 
app.use('/api/transaction', transactionRoutes);

app.listen(port, () => {
  console.log(`RTO app listening on port ${port}`)
})
