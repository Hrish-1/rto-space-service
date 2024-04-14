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

  const customerDetails = await partnerMaster.findOne({ customerId })


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

  let total = 0

  // Using Promise.all to handle multiple asynchronous operations in parallel
  let records = await Promise.all(

    entryIds.map(async (entryId, index) => {
      const entry = await TransactionEntry.findOne({ entryId, customerId: Number(customerId) })

      if (!entry) return null;
      total += parseInt(entry.amount)

      // Map the database model to the desired output structure
      return {
        srNo: index + 1, // Correctly set srNo using the index of the array
        vehicleNo: entry.vehicleNo,
        service: entry.services, // Assuming services is a single string, not an array
        reference: entry.letterNo || '',
        fromRTO: entry.fromRTO || '',
        toRTO: entry.toRTO || '',
        additionalCharge: '', // Not in the model; assuming it should be an empty string
        amount: entry.amount.toString() // Convert Decimal128 to string
      };
    })
  )
  console.log(total, 'total')

  records = records.filter(record => record !== null)

  let totalVehicles = records.length
  // return
  // Function to generate the items rows HTML
  const generateItemsRows = (items) => {
    return items.map(service =>
      `<tr class="item">
       <td>${service.srNo}</td>
       <td>${service.vehicleNo}</td>
       <td>${service.service}</td>
       <td>${service.reference}</td>
       <td>${service.fromRTO}</td>
       <td>${service.toRTO}</td>
       <td>${service.additionalCharge}</td>
       <td>${service.amount}</td>
        </tr>`
    ).join('');
  };
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


  const htmlContent = `<!DOCTYPE html>
 <html>
 <head>
   <meta charset="utf-8">
   <title>Invoice Template</title>
   <style>
     body {
       font-family: 'Helvetica Neue', 'Helvetica', sans-serif;
       color: #555;
       max-width: 800px;
       margin: auto;
       padding: 5px;
       box-shadow: 0 0 10px rgba(0, 0, 0, .15);
     }
 .container{
   display: flex;
   flex-wrap: nowrap;
   width: 100%;
   padding: 10px;
 
 }
     .invoice-header {
       display: flex;
       flex-wrap: wrap;
       justify-content: space-between;
       align-items: flex-start;
       margin-top: 0;
       width:30.3%;
     }
 
     .logo {
       height: 150px;
       width: 450px; 
       padding: 10px;
       text-align: left;
       margin-right: 20px;
     }
 
     .invoice-title {
       text-align: center;
       font-size: 20px;
       font-weight: bold;
       margin-top: 4px;
        width:30.3%;
     }
 
     .invoice-info {
       text-align: right;
       min-width: 200px;
       width:35%;
       margin-top: 25px;
 font-size: 0.8em;
     }
 
     .company-address {
       text-align: left;
       padding-left: 10px;
       margin-top: 0;
 
     }
 
     .invoice-header > div,
     .company-address {
       font-size: 0.8em;
       margin-bottom: 20px; /* Adjust spacing between logo and address */
 
     }
    
     .approval{
       display : flex;
       flex-wrap: wrap;
       justify-content: space-between;
       align-items: flex-start;
       margin-top: 20px
       margin-left: 10px;
       padding: 10px;
       width:70%;
     }
     .greeting{
      display : flex;
      justify-content: center;
      font-size: 1.5em;
      margin-top: 26px
      width:100%;
     }


 
     /* Additional styles for responsiveness if necessary */
     @media only screen and (max-width: 600px) {
       .invoice-header {
         flex-direction: column;
         align-items: center;
       }
 
       .logo,
       .invoice-info {
         width: 100%;
         text-align: center;
         margin: 10px 0;
       }
 
       .invoice-title {
         order: -1; /* Put INVOICE at the top */
       }
     }
 
     table {
       width: 100%;
       border-collapse: collapse;
     }
 
     table, th, td {
       border: 1px solid black;
     }
 
     th, td {
       padding: 8px;
       text-align: left;
     }
 
     th {
       background-color: #f2f2f2;
     }
   </style>
 </head>
 <body>
 <div class='container'>
   <div class="invoice-header">
     <div class="logo">
     <img src="http://localhost:8080/images/logo.jpg" style="width:150%; max-width:150px;">
     <div class="">
     <p>sai Anand Shopping Centre, Shop No. 10/11,<br>  
        Edulji Road Charai Thane,<br>
        Phone: 9833567595 / 7977021535<br>
        Email: gaikwadgajanan64@gmail.com</p>
   </div>
     </div>
     </div>
 
     <div class="invoice-title">
       INVOICE
     </div>
     <div class="invoice-info">
     <p>
  <strong>Invoice No:</strong> ${invoiceNumber}<br>
  <br>
  <strong>Date:</strong> ${formattedDate}<br>
  <br>
  <strong>For:</strong> Project or Sales<br>
  <br>
  <strong>Bill To:</strong> ${customerDetails.customerName}<br>
  <br>
  <strong>Company Name:</strong> ${customerDetails.companyName}<br>
  <br>
  <strong>Address:</strong> ${customerDetails.address}<br>
  <br>
  <strong>Bill To Phone:</strong> ${customerDetails.contactNo1}/${customerDetails.contactNo2}
</p>
     </div>
   </div>
 
   
 
   <table class="table">
   <tr>
     <th>Sr. No.</th>
     <th>Vehicle No.</th>
     <th>Service</th>
     <th>Reference</th>
     <th>From RTO</th>
     <th>To RTO</th>
     <th>Additional Charge</th>
     <th>Amount</th>
   </tr>
   <tr>
   ${generateItemsRows(records)}
   <tr>
   <td colspan="7" class="text-right"><strong>Discount</strong></td>
   <td class="text-right"></td>
 </tr>
 <tr>
   <td colspan="7" class="text-right"><strong>Total</strong></td>
   <td class="text-right">${total}</td>
 </tr>
 <tr>
   <td colspan="2" class="text-right"><strong>Amount in Words</strong></td>
   <td colspan="6" class="text-right"> ${await convertToRupeesInWords(total)}</td>
 </tr>
 </table>

 <footer >
 <div class="approval">
<p>Checked by </p>

<p>Recieved by </p>
</div>
<div>
<p class="greeting">Thank you for your business</p>
</div>
</footer>


 </body>
 </html>
 
 `
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

  const newInvoice = await Invoice.create(invoiceData);
  console.log('Invoice created successfully:', newInvoice);

  return res.status(200).json({ message: 'File uploaded successfully', url: invoicePdfUrl });
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
