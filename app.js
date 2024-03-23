import express from 'express'
const app = express()
import bodyParser from 'body-parser';
import cors from 'cors'; // from cors
import dotenv from 'dotenv';
dotenv.config();
const port = process.env.PORT || 3000
import connectDB from './config/db.js';
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // JSON Middleware
connectDB()

import  authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactionRoutes.js';

app.use('/api', authRoutes); 
app.use('/api/transaction', transactionRoutes);

app.listen(port, () => {
  console.log(`RTO app listening on port ${port}`)
})
