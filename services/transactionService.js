import multer from 'multer';
import TransactionEntry from '../models/transaction.js';
import path from 'path';
import fs from 'fs';
import { generateEntryID, convertToRupeesInWords } from '../utils.js';
import InvoiceNumber from '../models/invoiceCount.js';
import html_to_pdf from 'html-pdf-node';
import partnerMaster from '../models/partnerMaster.js';
import Invoice from '../models/invoice.js';

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

export const createEntry = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // handle error
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }
    try {
      // Generate EntryID
      const entryID = await generateEntryID();
      console.log(entryID, 'entryID')
      // Construct new entry data with generated EntryID
      const entryData = {
        entryId: entryID,
        entryDate: Date.now(),
        vehicleNo: req.body.vehicleNo,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        fromRTO: req.body.fromRTO,
        toRTO: req.body.toRTO,
        services: req.body.services,
        amount: req.body.amount,
        chasisProof: req.files['chasisProof'] ? getPdfUrl(req.files['chasisProof'][0].filename) : undefined,
        insuranceProof: req.files['insuranceProof'] ? getPdfUrl(req.files['insuranceProof'][0].filename) : undefined,
        pancardProof: req.files['pancardProof'] ? getPdfUrl(req.files['pancardProof'][0].filename) : undefined,
        addressProof: req.files['addressProof'] ? getPdfUrl(req.files['addressProof'][0].filename) : undefined,
      };

      if (entryData.chasisProof && entryData.insuranceProof && entryData.pancardProof && entryData.addressProof) {
        entryData['status'] = 'READY'
      } else {
        entryData['status'] = 'CREATED'
      }
      const entry = new TransactionEntry(entryData);
      await entry.save();
      console.log(entry, 'entry')
      res.status(201).json({ message: 'Entry created successfully', entryId: entry.entryId });
    } catch (error) {
      res.status(500).json({ message: 'Error creating entry', error: error.message });
    }
  });
};

// Ensure the uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

function getCriteria(fieldName, value) {
  switch (fieldName) {
    case 'entryDate':
      return { [fieldName]: { $gte: new Date(value.from), $lt: new Date(value.to) } }
    case 'customerName':
      return { [fieldName]: { $regex: value, $options: 'i' } }
    default:
      return { [fieldName]: value }
  }
}

export const getEntry = async (req, res) => {

  let { status, keyword, from, to } = req.query;
  const page = parseInt(req.query.page, 10) || 0
  const size = parseInt(req.query.size, 10) || 10

  const hasDateRangeQuery = from && to
  const searchRequest = {
    status: status,
    customerName: keyword,
    entryDate: hasDateRangeQuery ? { from: from, to: to } : null
  }

  try {

    const criteria = Object.keys(searchRequest)
      .filter(x => searchRequest[x])
      .map(x => getCriteria(x, searchRequest[x]))

    const items = await TransactionEntry
      .aggregate([
        criteria.length ? { $match: { $and: criteria } } : null,
        { $skip: page * size },
        { $limit: size },
        {
          $addFields: {
            amount: { $toDouble: "$amount" }
          }
        }
      ].filter(x => x))
      .exec()

    const [{ totalItems }] = await TransactionEntry
      .aggregate([
        criteria.length ? { $match: { $and: criteria } } : null,
        {
          $facet: {
            "result": [{ $count: "count" }]
          }
        },
        {
          $project: {
            "totalItems": {
              $ifNull: [{ $arrayElemAt: ["$result.count", 0] }, 0]
            }
          }
        }
      ].filter(x => x))
      .exec()

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
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entries', error: error.message });
  }
}


export const updateEntry = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // handle error
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }
    const entryID = req.params.id; // Assuming entryID is passed as a URL parameter
    try {
      // Construct update object
      let updateData = {};
      Object.keys(req.body).forEach(key => {
        updateData[key] = req.body[key];
      });


      // Handle file uploads if any
      if (req.files) {
        if (req.files['chasisProof']) updateData.chasisProofPdfName = `http://localhost:3027/uploads/${req.files['chasisProof'][0].filename}`;
        if (req.files['insuranceProof']) updateData.insuranceProofPdfName = `http://localhost:3027/uploads/${req.files['insuranceProof'][0].filename}`;
        if (req.files['pancardProof']) updateData.pancardProofPdfName = `http://localhost:3027/uploads/${req.files['pancardProof'][0].filename}`;
        if (req.files['addressProof']) updateData.addressProofPdfName = `http://localhost:3027/uploads/${req.files['addressProof'][0].filename}`;
      }

      // Update the entry
      const updatedEntry = await TransactionEntry.findOneAndUpdate({ entryId: entryID }, updateData, { new: true });
      if (!updatedEntry) {
        return res.status(404).json({ message: 'Entry not found' });
      }
      res.status(200).json(updatedEntry);
    } catch (error) {
      res.status(500).json({ message: 'Error updating entry', error: error.message });
    }
  });
};

export const deleteEntry = async (req, res) => {
  const entryId = req.query.entryId;
  try {
    const deletedEntry = await TransactionEntry.findOneAndDelete({ entryId });
    if (!deletedEntry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entry', error: error.message });
  }
}

export const generatepdf = async (req, res) => {

  try {
    const customerId = req.body.customerId
    const entryIds = req.body.transactionIds
    if (!customerId || !entryIds || !Array.isArray(entryIds)) {
      return res.status(400).json({ message: 'Invalid request data' });
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
        reject()
      }
    }))

    console.log('PDF file has been written successfully');
    const invoiceData = {
      InvoiceNo: invoiceNumber,
      InvoiceDate: formattedDate,
      CustomerID: customerId,
      TotalVehicles: totalVehicles,
      TotalAmount: total,
      // ReceivedAmount: 800.00, // Partial payment received
      // Discount: 50 // Discount given
    };

    const newInvoice = await Invoice.create(invoiceData);
    console.log('Invoice created successfully:', newInvoice);

    return res.status(200).json({ message: 'File uploaded successfully', url: `http://localhost:8080/invoices/${customerId}_${dateTimeString}.pdf` });
  } catch (error) {
    console.log(error, 'error')
    return res.status(500).json({ message: 'File upload failed', error: error.message });
  }
}

export function updateStatus(req, res) {
  try {
    const { ids, status } = req.body
    const bulkOps = TransactionEntry.collection.initializeUnorderedBulkOp();
    bulkOps.find({ 'entryId': { $in: ids } }).update({ $set: { status } });
    bulkOps.execute();
    return res.status(204).send()
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
