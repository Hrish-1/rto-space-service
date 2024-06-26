import express from 'express'
import bodyParser from 'body-parser';
import cors from 'cors'; // from cors
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import fetchRoutes from './routes/fetchRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import deliveryRoutes from './routes/deliveryRoutes.js'
import dotenv from 'dotenv';
import errorHandler from './layers/errorLayer.js';
import Handlebars from 'handlebars';
import fs from 'fs'


dotenv.config({ path: `./.env.${process.env.NODE_ENV}` });

const app = express()

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // JSON Middleware
const __dirname = path.dirname(fileURLToPath(import.meta.url));

Handlebars.registerHelper("inc", (value, _) => parseInt(value) + 1);

connectDB()

function createDirectories() {
  const uploadsDir = './uploads';
  !fs.existsSync(uploadsDir) && fs.mkdirSync(uploadsDir)

  const imgDir = './images'
  !fs.existsSync(imgDir) && fs.mkdirSync(imgDir)

  const invoiceDir = './invoices'
  !fs.existsSync(invoiceDir) && fs.mkdirSync(invoiceDir)

  const deliveryDir = './deliveries'
  !fs.existsSync(deliveryDir) && fs.mkdirSync(deliveryDir)

  const formDir = './forms'
  !fs.existsSync(formDir) && fs.mkdirSync(formDir)
}

createDirectories()

// Serve static files from "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use('/deliveries', express.static(path.join(__dirname, 'deliveries')));
app.use('/forms', express.static(path.join(__dirname, 'forms')));

app.use('/api/fetch', fetchRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/transactions', transactionRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/deliveries', deliveryRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`RTO app listening on port ${PORT}`))
