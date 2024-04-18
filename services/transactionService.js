import multer from 'multer';
import TransactionEntry from '../models/transaction.js';
import path from 'path';
import fs from 'fs';
import { generateEntryID, convertToRupeesInWords } from '../utils.js';
import InvoiceNumber from '../models/invoiceCount.js';
import html_to_pdf from 'html-pdf-node';
import partnerMaster from '../models/partnerMaster.js';
import Invoice from '../models/invoice.js';
import asyncHandler from '../layers/asyncHandler.js';
import Handlebars from 'handlebars';

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
    amount: req.body.amount
  };

  if (entryData.chasisProof && entryData.insuranceProof && entryData.pancardProof && entryData.addressProof) {
    entryData['status'] = 'READY'
  } else {
    entryData['status'] = 'CREATED'
  }

  const entry = new TransactionEntry(entryData);
  await entry.save();
  res.status(201).json({ entryId: entry.entryId });
});

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

export const generatepdf = asyncHandler(async (req, res) => {

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

  Handlebars.registerHelper("inc", (value, _) => parseInt(value) + 1);
  const template = Handlebars.compile(templateHtml)
  const htmlContent = template(dataBinding)

  let options = { format: 'A4' };
  let file = { content: htmlContent };

  const now = new Date();


  const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');


  const outputPath = `./invoices/${customerId}_${dateTimeString}.pdf`;

  await new Promise((resolve, reject) => html_to_pdf.generatePdf(file, options, (_, buffer) => {
    try {
      fs.writeFileSync(outputPath, buffer);
      resolve()
    } catch (err) {
      reject(err)
    }
  }))

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

  await TransactionEntry.updateMany({ entryId: { $in: entryIds }}, { invoiceNo: invoiceNumber })

  const newInvoice = await Invoice.create(invoiceData);
  console.log('Invoice created successfully:', newInvoice);

  return res.status(200).json({ url: invoicePdfUrl });
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
