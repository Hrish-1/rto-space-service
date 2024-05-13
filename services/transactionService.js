import multer from 'multer';
import TransactionEntry from '../models/transaction.js';
import path from 'path';
import fs from 'fs';
import { generateEntryID, convertToRupeesInWords } from '../utils.js';
import InvoiceNumber from '../models/invoiceCount.js';
import DeliveryNumber from '../models/deliveryCount.js';

import { generatePdfs, generatePdf } from '../utils/htmlToPdf.js'
import partnerMaster from '../models/partnerMaster.js';
import Invoice from '../models/invoice.js';
import asyncHandler from '../layers/asyncHandler.js';
import Handlebars from 'handlebars';
import Delivery from '../models/delivery.js';

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    // Generate a unique alphanumeric string for the document
    const uniqueSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure multer to handle each file type separately
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "chasisProof" || file.fieldname === "insuranceProof" ||
    file.fieldname === "pancardProof" || file.fieldname === "addressProof") {
    cb(null, true);
  } else {
    cb(new Error('Unexpected file fieldname'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter }).fields([
  { name: 'chasisProof', maxCount: 1 },
  { name: 'insuranceProof', maxCount: 1 },
  { name: 'pancardProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]);

function getPdfUrl(fileName) {
  return `${process.env.BASE_URL}/uploads/${fileName}`
}

export const createTransaction = asyncHandler(async (req, res) => {
  const files = await new Promise((resolve, reject) => upload(req, res, err => {
    if (err) {
      reject(err)
    }
    resolve({
      chasisProof: req.files['chasisProof'] ? getPdfUrl(req.files['chasisProof'][0].filename) : undefined,
      insuranceProof: req.files['insuranceProof'] ? getPdfUrl(req.files['insuranceProof'][0].filename) : undefined,
      pancardProof: req.files['pancardProof'] ? getPdfUrl(req.files['pancardProof'][0].filename) : undefined,
      addressProof: req.files['addressProof'] ? getPdfUrl(req.files['addressProof'][0].filename) : undefined,
    })
  }))

  const entryID = await generateEntryID();

  // Construct new entry data with generated EntryID
  const vehicleNo = req.body.vehicleNo ? JSON.parse(req.body.vehicleNo) : null
  const entryData = {
    ...files,
    entryId: entryID,
    entryDate: Date.now(),
    vehicleNo: vehicleNo ? vehicleNo.rto + " " + vehicleNo.number : null,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    fromRTO: req.body.fromRTO,
    toRTO: req.body.toRTO,
    services: req.body.services ? JSON.parse(req.body.services).join("/") : null,
    amount: req.body.amount,
    sellerName: req.body.sellerName,
    sellerAddress: req.body.sellerAddress,
    purchaserName: req.body.purchaserName,
    purchaserAddress: req.body.purchaserAddress,
    chasisNo: req.body.chasisNo
  };

  if (entryData.chasisProof && entryData.insuranceProof && entryData.pancardProof && entryData.addressProof) {
    entryData['status'] = 'READY'
  } else {
    entryData['status'] = 'CREATED'
  }

  if (req.body.generateForms) {
    const { form30part1, form30part2, form29 } = await generateForms(entryData);
    entryData['form30part1'] = form30part1
    entryData['form30part2'] = form30part2
    entryData['form29'] = form29
  }

  const entry = new TransactionEntry(entryData);
  await entry.save();
  res.status(201).json({ entryId: entry.entryId });
});


async function generateForms(entryData) {
  const form30p1templateHtml = fs.readFileSync(path.join(process.cwd(), "views", "form30-1.html"), "utf8");
  const form30p2templateHtml = fs.readFileSync(path.join(process.cwd(), "views", "form30-2.html"), "utf8");
  const form29templateHtml = fs.readFileSync(path.join(process.cwd(), "views", "form29.html"), "utf8");

  const dataBinding = {
    sellerName: entryData.sellerName,
    sellerAddress: entryData.sellerAddress,
    purchaserName: entryData.purchaserName,
    purchaserAddress: entryData.purchaserAddress,
    vehicleNo: entryData.vehicleNo,
    chasisNo: entryData.chasisNo
  }

  const form30p1outputPath = `./forms/form30-1-${entryData.entryId}.pdf`;
  const form30p2outputPath = `./forms/form30-2-${entryData.entryId}.pdf`;
  const form29outputPath = `./forms/form29-${entryData.entryId}.pdf`;

  const files = [
    { content: Handlebars.compile(form30p1templateHtml)(dataBinding), path: form30p1outputPath },
    { content: Handlebars.compile(form30p2templateHtml)(dataBinding), path: form30p2outputPath },
    { content: Handlebars.compile(form29templateHtml)(dataBinding), path: form29outputPath }
  ]
  let options = { format: 'A4' };
  await generatePdfs(files, options);

  return {
    form30part1: `${process.env.BASE_URL}` + form30p1outputPath.slice(1),
    form30part2: `${process.env.BASE_URL}` + form30p2outputPath.slice(1),
    form29: `${process.env.BASE_URL}` + form29outputPath.slice(1),
  }
}

// Ensure the uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

function getDeserializedValue(key, value) {
  switch (key) {
    case "vehicleNo":
      const vehicleNo = value ? JSON.parse(value) : null
      return vehicleNo ? vehicleNo.rto + " " + vehicleNo.number : null
    case "services":
      const services = value ? JSON.parse(value) : null
      return services ? services.join("/") : null
    default:
      return value
  }
}

export const updateTransaction = asyncHandler(async (req, res) => {
  const entryId = req.params.id;
  const transaction = await TransactionEntry.findOne({ entryId })
  if (!transaction) {
    res.status(404)
    throw new Error('Transaction not found')
  }
  const files = await new Promise((resolve, reject) => upload(req, res, err => {
    if (err) {
      reject(err)
    }
    let uploadedFiles = {}
    if (req.files) {
      if (req.files['chasisProof']) uploadedFiles.chasisProof = `${process.env.BASE_URL}/uploads/${req.files['chasisProof'][0].filename}`;
      if (req.files['insuranceProof']) uploadedFiles.insuranceProof = `${process.env.BASE_URL}/uploads/${req.files['insuranceProof'][0].filename}`;
      if (req.files['pancardProof']) uploadedFiles.pancardProof = `${process.env.BASE_URL}/uploads/${req.files['pancardProof'][0].filename}`;
      if (req.files['addressProof']) uploadedFiles.addressProof = `${process.env.BASE_URL}/uploads/${req.files['addressProof'][0].filename}`;
    }
    resolve(uploadedFiles)
  }))

  let updateData = {};
  Object.keys(req.body).filter(key => key !== '_id').forEach(key => {
    updateData[key] = getDeserializedValue(key, req.body[key]) ?? null
  });

  if (updateData.chasisProof && updateData.insuranceProof && updateData.pancardProof && updateData.addressProof) {
    updateData['status'] = 'READY'
  }

  if (req.body.generateForms) {
    const { form30part1, form30part2, form29 } = await generateForms(updateData);
    updateData['form30part1'] = form30part1
    updateData['form30part2'] = form30part2
    updateData['form29'] = form29
  }

  await TransactionEntry.findOneAndUpdate({ entryId }, { ...updateData, ...files });
  res.status(204).send();
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const entryId = req.params.id;
  const deletedEntry = await TransactionEntry.findOneAndDelete({ entryId });
  if (!deletedEntry) {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  res.status(204).send()
})

export const generateInvoicePdf = asyncHandler(async (req, res) => {

  const customerId = req.body.customerId
  const entryIds = req.body.transactionIds
  if (!customerId || !entryIds || !Array.isArray(entryIds)) {
    res.status(400)
    throw new Error('Invalid request data')
  }

  const { customerName, companyName, contactNo1, contactNo2, address } = await partnerMaster.findOne({ customerId })


  let lastInvoice = await InvoiceNumber.findOne({}).sort({ invoiceNo: -1 }).exec();
  if (!lastInvoice) {
    // Handle the case for the very first invoice
    lastInvoice = new InvoiceNumber({ invoiceNo: 1 });
  } else {
    // Increment the existing invoice number
    lastInvoice.invoiceNo++;
  }
  // Save the new invoice number
  await lastInvoice.save();

  const invoiceNumber = lastInvoice.invoiceNo;

  const records = await TransactionEntry.aggregate([
    { $match: { entryId: { $in: entryIds }, customerId: Number(customerId) } },
    { $addFields: { amount: { $toDouble: "$amount" } } },
  ]).exec()

  const total = records.reduce((acc, curr) => acc + curr.amount, 0)

  const totalVehicles = records.length
  const today = new Date();

  // Extract parts of the date
  const dayName = today.toLocaleString('en-US', { weekday: 'short' }); // e.g., 'Mon'
  const monthName = today.toLocaleString('en-US', { month: 'short' }); // e.g., 'Jan'
  const dayOfMonth = today.getDate(); // e.g., 1
  const year = today.getFullYear(); // e.g., 2024

  // Construct the formatted string
  const formattedDate = `${dayName} ${monthName} ${dayOfMonth} ${year}`;
  const amountInWords = convertToRupeesInWords(total)
  console.log(amountInWords, 'amountInWords')

  const templateHtml = fs.readFileSync(path.join(process.cwd(), "views", "invoice.html"), "utf8");
  const dataBinding = {
    items: records,
    customerName,
    companyName,
    address,
    contactNo1,
    contactNo2,
    amountInWords,
    total,
    formattedDate,
    invoiceNumber
  }

  const template = Handlebars.compile(templateHtml)
  const htmlContent = template(dataBinding)


  const now = new Date();


  const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');


  const outputPath = `./invoices/${customerId}_${dateTimeString}.pdf`;

  let options = { format: 'A4' };
  let file = { content: htmlContent, path: outputPath };

  await generatePdf(file, options);

  const invoicePdfUrl = `${process.env.BASE_URL}/invoices/${customerId}_${dateTimeString}.pdf`

  console.log('PDF file has been written successfully');
  const invoiceData = {
    invoiceNo: invoiceNumber,
    invoiceDate: new Date(),
    customerId: customerId,
    totalVehicles: totalVehicles,
    totalAmount: total,
    invoicePdf: invoicePdfUrl
    // ReceivedAmount: 800.00, // Partial payment received
    // Discount: 50 // Discount given
  };

  await TransactionEntry.updateMany({ entryId: { $in: entryIds } }, { invoiceNo: invoiceNumber })

  const newInvoice = await Invoice.create(invoiceData);
  console.log('Invoice created successfully:', newInvoice);

  return res.status(200).json({ url: invoicePdfUrl });
})


async function createDeliveryDocuments(records, deliveryData) {
  try {
    // Extract constant values from req.body
    const { toRto, deliveryBy, deliveryDate, deliveryPdfUrl, deliveryNo } = deliveryData;

    // Initialize array to store new delivery documents
    const deliveryDocuments = [];

    // Loop through each record
    for (const record of records) {
      const { vehicleNo, services } = record;

      // Create a new Delivery document
      const newDelivery = new Delivery({
        deliveryNo,
        deliveryDate,
        deliveryBy,
        services,
        vehicleNo,
        toRto,
        deliveryPdfUrl
      });

      // Save the new Delivery document to the collection
      const savedDelivery = await newDelivery.save();

      // Push the saved Delivery document to the array
      deliveryDocuments.push(savedDelivery);
    }

    return deliveryDocuments;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export const generateDeliveryPdf = asyncHandler(async (req, res) => {

  const toRto = req.body.toRTO
  const deliveryBy = req.body.deliveryBy
  const entryIds = req.body.transactionIds
  if (!toRto || !entryIds || !Array.isArray(entryIds)) {
    res.status(400)
    throw new Error('Invalid request data')
  }

  let lastDeliveryNo = await DeliveryNumber.findOne({}).sort({ deliveryNo: -1 }).exec();
  if (!lastDeliveryNo) {
    // Handle the case for the very first invoice
    lastDeliveryNo = new DeliveryNumber({ deliveryNo: 1 });
  } else {
    // Increment the existing invoice number
    lastDeliveryNo.deliveryNo++;
  }
  // Save the new invoice number
  await lastDeliveryNo.save();

  const deliveryNumber = lastDeliveryNo.deliveryNo;
  console.log(deliveryNumber, 'deliveryNumber  ')
  const records = await TransactionEntry.aggregate([
    { $match: { entryId: { $in: entryIds }, toRTO: toRto } },
  ]).exec()



  const today = new Date();

  // Extract parts of the date
  const dayName = today.toLocaleString('en-US', { weekday: 'short' }); // e.g., 'Mon'
  const monthName = today.toLocaleString('en-US', { month: 'short' }); // e.g., 'Jan'
  const dayOfMonth = today.getDate(); // e.g., 1
  const year = today.getFullYear(); // e.g., 2024

  // Construct the formatted string
  const formattedDate = `${dayName} ${monthName} ${dayOfMonth} ${year}`;

  const templateHtml = fs.readFileSync(path.join(process.cwd(), "views", "deliveries.html"), "utf8");
  const dataBinding = {
    items: records,
    toRto,
    formattedDate,
    deliveryNumber,
    deliveryBy
  }

  const template = Handlebars.compile(templateHtml)
  const htmlContent = template(dataBinding)


  const now = new Date();


  const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');


  const outputPath = `./deliveries/${toRto}_${dateTimeString}.pdf`;
  let options = { format: 'A4' };
  let file = { content: htmlContent, path: outputPath };

  await generatePdf(file, options);

  const deliveryPdfUrl = `${process.env.BASE_URL}/deliveries/${toRto}_${dateTimeString}.pdf`


  const deliveryData = {
    deliveryNo: deliveryNumber,
    deliveryDate: formattedDate,
    deliveryBy,
    toRto,
    deliveryPdfUrl
  };

  const deliveryDocuments = await createDeliveryDocuments(records, deliveryData);
  console.log(deliveryDocuments, 'deliveryDocuments')
  await TransactionEntry.updateMany(
    { entryId: { $in: entryIds }, toRTO: toRto },
    { $set: { deliveryNo: deliveryNumber } }
  );

  return res.status(200).json({ url: deliveryPdfUrl });
})

export const updateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body
  const bulkOps = TransactionEntry.collection.initializeUnorderedBulkOp();
  bulkOps.find({ 'entryId': { $in: ids } }).update({ $set: { status } });
  await bulkOps.execute();
  return res.status(204).send()
})

const criteriaFuncs = {
  entryDate: (value) => ({ $gte: new Date(value.from), $lt: new Date(value.to) }),
  customerName: (value) => ({ $regex: value, $options: 'i' }),
  status: (value) => value,
  toRTO: (value) => value
}

export const getTransactions = asyncHandler(async (req, res) => {
  let { status, keyword, from, to, toRTO } = req.query;
  const page = parseInt(req.query.page, 10) || 0
  const size = parseInt(req.query.size, 10) || 10

  const hasDateRangeQuery = from && to

  const searchRequest = {
    status,
    customerName: keyword,
    entryDate: hasDateRangeQuery ? { from: from, to: to } : null,
    toRTO
  }

  const searchCriteria = Object.keys(searchRequest)
    .filter(x => searchRequest[x])
    .reduce((acc, curr) => {
      acc[curr] = criteriaFuncs[curr](searchRequest[curr])
      return acc
    }, {})

  const totalItems = await TransactionEntry.countDocuments({ ...searchCriteria });
  const items = await TransactionEntry.aggregate([
    { $match: searchCriteria },
    { $sort: { entryId: -1 } },
    { $skip: size * page },
    { $limit: size },
    { $addFields: { amount: { $toDouble: "$amount" } } }
  ]);

  const totalPages = Math.ceil(totalItems / size);
  const isFirst = page === 0;
  const isLast = page === Math.max(0, totalPages - 1);

  res.json({
    items,
    page,
    size,
    isFirst,
    isLast,
    totalPages,
    totalItems
  });

})
