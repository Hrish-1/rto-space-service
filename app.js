import express from 'express'
import bodyParser from 'body-parser';
import cors from 'cors'; // from cors
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import  authRoutes from './routes/auth.js';
import fetchRoutes from './routes/fetchRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dotenv from 'dotenv';
import service from './models/serviceData.js';

dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

const app = express()
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // JSON Middleware

connectDB()
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

app.use('/api', authRoutes); 
app.use('/api/transaction', transactionRoutes);
app.use('/api/fetch', fetchRoutes);



const PORT = process.env.PORT || 8080 
app.listen(PORT, () => console.log(`RTO app listening on port ${PORT}`))
