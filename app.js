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

import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactionRoutes.js';
import TransactionEntry from './models/transaction.js';

<<<<<<< HEAD
// Serve static files from "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', authRoutes); 
app.use('/api/transaction', transactionRoutes);
app.use('/api/fetch', fetchRoutes);

const PORT = process.env.PORT || 8080 
app.listen(PORT, () => console.log(`RTO app listening on port ${PORT}`))
=======
app.use('/api', authRoutes);
app.use('/api/transaction', transactionRoutes);


// const generatepdf = async () => {
//   try {
//     // Fetch the transaction record from the database
//     // const { entryId } = req.body;
//     const entryId = "2024mar-030"
//     const transaction = await TransactionEntry.findOne({ entryId: entryId });

//     if (!transaction) {
//       return res.status(404).send('Transaction not found');
//     }
//     const doc = new PDFDocument({ margin: 50 });
//     const logoPath = path.resolve(__dirname, './logo.jpg'); // replace with your actual path to the logo
//     const pdfPath = `invoice1-${entryId}.pdf`;
//     doc.pipe(fs.createWriteStream(pdfPath));

//     // Logo and title
//     doc.image(logoPath, 50, 40, { width: 100 })
//       .fontSize(16)
//       .font('Helvetica-Bold')
//       .text('INVOICE', 50, 150, { align: 'left' });

//     // Seller info
//     doc.fontSize(10)
//       .font('Helvetica')
//       .text('Sai Anand Shopping Centre Shop No. 10/11', 50, 170)
//       .text('Edulji Road Charai Thane', 50, 185)
//       .text('Phone: 9833567595 / 7977021535', 50, 200)
//       .text('Email: gaikwadgajanan64@gmail.com', 50, 215);

//     // Buyer info
//     doc.text(`Invoice No: ${transaction.invoiceNo}`, 400, 170)
//       .text(`Date: ${transaction.invoiceDate || 'no date'}`, 400, 185)
//       .text('Bill To:', 400, 200)
//       .text('WHEELS EMI PVT LTD (070)', 400, 215)
//       .text('OFFICE NO 208 A WING SAGARTECH PLAZA', 400, 230)
//       .text('NEAR SAKINAKA METRO STATION', 400, 245)
//       .text('SAKINAKA MUMBAI 400072', 400, 260)
//       .text('9702422349/7977709326', 400, 275);

//     // Table headers
//     const tableTop = 300;
//     doc.fontSize(10)
//       .text('Sr. No.', 50, tableTop)
//       .text('Vehicle No.', 120, tableTop, { width: 90, align: 'left' })
//       .text('Service', 210, tableTop, { width: 90, align: 'left' })
//       .text('From RTO', 300, tableTop, { width: 90, align: 'left' })
//       .text('To RTO', 390, tableTop, { width: 90, align: 'left' })
//       .text('Amount', 480, tableTop, { width: 90, align: 'left' });

//     // Table row
//     const y = tableTop + 20;
//     doc.rect(50, y, 500, 20).stroke() // Drawing the row outline
//       .fontSize(10)
//       .text('1', 52, y + 5, { width: 45, align: 'left' })
//       .text(transaction.vehicleNo, 120, y + 5, { width: 90, align: 'left' })
//       .text(transaction.services, 210, y + 5, { width: 90, align: 'left' })
//       .text(transaction.fromRTO, 300, y + 5, { width: 90, align: 'left' })
//       .text(transaction.toRTO, 390, y + 5, { width: 90, align: 'left' })
//       .text(transaction.amount.toString(), 480, y + 5, { width: 90, align: 'left' });

//     // Amount in words
//     doc.text(`Amount in Words: ${transaction.amount || "one million"}`, 50, y + 45);

//     // Add the final thank you note
//     // doc.text('Thank you for your business', 50, yPosition + 40);

//     // Finalize the PDF and end the stream
//     doc.end();

//     // Send a response
//     console.log('pdf created');

//   } catch (error) {
//     console.log('error', error);
//     // res.status(500).send(error.message);
//   }
// }



// generatepdf()



// EJS template for the invoice
const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice</title>
</head>
<body>
    <img src="logo.jpg" alt="Company Logo" />
    <h1>INVOICE</h1>
    <p><strong>Invoice No:</strong> <%= invoiceNo %></p>
    <p><strong>Date:</strong> <%= invoiceDate %></p>
    <p><strong>For:</strong> <%= customerName %></p>
    <p><strong>Bill To:</strong> <%= customerAddress %></p>
    <p><strong>Bill To Phone:</strong> <%= customerMobile %></p>
    <table>
        <tr>
            <th>Sr. No.</th>
            <th>Vehicle No.</th>
            <th>Service</th>
            <th>From RTO</th>
            <th>To RTO</th>
            <th>Additional Charge</th>
            <th>Amount</th>
        </tr>
        <% transactions.forEach(function(transaction, index) { %>
            <tr>
                <td><%= index + 1 %></td>
                <td><%= transaction.vehicleNo %></td>
                <td><%= transaction.services %></td>
                <td><%= transaction.fromRTO %></td>
                <td><%= transaction.toRTO %></td>
                <td><%= transaction.additionalCharge %></td>
                <td><%= transaction.amount %></td>
            </tr>
        <% }); %>
    </table>
    <p><strong>Total:</strong> <%= totalAmount %></p>
    <p><strong>Amount in Words:</strong> <%= amountInWords %></p>
</body>
</html>
`;

// Function to generate PDF
const generatePDF = async (entryId, callback) => {
  try {
    const transaction = await TransactionEntry.findOne({ entryId: entryId });
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Render HTML content with EJS
    // Use EJS to render the HTML content
    const html = ejs.render(invoiceTemplate, {
      invoiceNo: transaction.invoiceNo,
      invoiceDate: transaction.invoiceDate,
      customerName: transaction.customerName,
      customerAddress: `${transaction.purchaserAddress}, ${transaction.purchaserSO}`,
      customerMobile: transaction.purchaserMobile,
      transactions: [transaction], // Assuming you have a list of transactions
      totalAmount: transaction.amount.toString(),
      amountInWords: 'One Lakh Sixteen Thousand One Hundred Only' // You would calculate this
    });

    // Generate PDF from HTML content
    const doc = new PDFDocument();
    const stream = fs.createWriteStream('output.pdf');
    doc.pipe(stream);

    // PDF generation logic
    doc.fontSize(12).text(html, {
      width: 410,
      align: 'left',
      ellipsis: true
    });
    doc.end();

    stream.on('finish', function () {
      callback(null, 'output.pdf');
    });
  } catch (error) {
    callback(error, null);
  }
};

// Call the function with hardcoded entryId
// generatePDF('2024mar-030', (error, filePath) => {
//   if (error) {
//       console.error(error);
//       // Handle error
//   } else {
//       console.log(`PDF generated at: ${filePath}`);
//       // PDF is generated, do something with filePath
//   }
// });


// html-pdf-node
// import html_to_pdf from 'html-pdf-node';
// const genpdf = () => {
//   let options = { format: 'A4' };
//   // Example of options with args //
//   // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

//   let file = { content: "<h1>Welcome to html-pdf-node</h1>" };


//   html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
//     console.log("PDF Buffer:-", pdfBuffer);
//   })
// }
// genpdf()


function htmlToPdf(html, outputPath) {
    const options = {
        format: 'A4',
        border: {
            top: '0.5in',
            right: '0.5in',
            bottom: '0.5in',
            left: '0.5in'
        }
        // Add more options as needed
    };

    pdf.create(html, options).toFile(outputPath, function(err, res) {
        if (err) return console.log(err);
        console.log(`PDF has been created at ${res.filename}`);
    });
}

const items = [
  { name: "First item", price: 123 },
  { name: "Second item", price: 456 },
  // Add more items as needed
];

// Function to generate the items rows HTML
const generateItemsRows = (items) => {
  return items.map(item => 
      `<tr class="item">
          <td>${item.name}:</td>
          <td>${item.price}$</td>
       </tr>`
  ).join('');
};

// Usage example
const today = new Date();

const htmlContent = ` <!doctype html>
<html>
   <head>
      <meta charset="utf-8">
      <title>PDF Result Template</title>
      <style>
         .invoice-box {
         max-width: 1000px;
         margin: auto;
         padding: 5px;
         border: 1px solid #eee;
         box-shadow: 0 0 10px rgba(0, 0, 0, .15);
         font-size: 10px;
         line-height: 24px;
         font-family: 'Helvetica Neue', 'Helvetica',
         color: #555;
         }
         .margin-top {
         margin-top: 50px;
         }
         .justify-center {
         text-align: center;
         }
         .invoice-box table {
          width: 100%;
          line-height: inherit;
          text-align: left;
          border-collapse: collapse; /* Ensure borders collapse */
      }
         .invoice-box table td {
         padding: 5px;
         vertical-align: top;
         }
         .invoice-title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          vertical-align: middle; /* Aligns content vertically center in the cell */
       }
        //  .invoice-box table tr td:nth-child(5) {
        //  text-align: right;
        //  }
         .invoice-box table tr.top table td {
         padding-bottom: 20px;
         }
         .invoice-box table tr.top table td.title {
         font-size: 45px;
         line-height: 45px;
         color: #333;
         }
         .invoice-box table tr.information table td {
         padding-bottom: 40px;
         }
         .invoice-box table tr.heading td {
         background: #eee;
         border-bottom: 1px solid #ddd;
         font-weight: bold;
         }
         .invoice-box table tr.details td {
         padding-bottom: 20px;
         }
         .invoice-box table tr.item td {
         border-bottom: 1px solid #eee;
         }
         .invoice-box table tr.item.last td {
         border-bottom: none;
         }
         .invoice-box table tr.total td:nth-child(2) {
         border-top: 2px solid #eee;
         font-weight: bold;
         }
         @media only screen and (max-width: 600px) {
         .invoice-box table tr.top table td {
         width: 100%;
         display: block;
         text-align: center;
         }
         .invoice-box table tr.information table td {
         width: 100%;
         display: block;
         text-align: center;
         }
         }
      </style>
   </head>
   <body>
      <div class="invoice-box">
         <table cellpadding="0" cellspacing="0">
            <tr class="top">
            <tr class="top">
            <td style="width:33.3%;">
               <img src="http://localhost:3027/images/logo.jpg" style="width:100%; max-width:100px;">
               <p>sai Anand Shopping Centre, Shop No. 10/11,<br>  
               Edulji Road Charai Thane,<br>
               Phone: 9833567595 / 7977021535<br>
               Email: gaikwadgajanan64@gmail.com</p>
            </td>
            <td class="invoice-title" style="width:33.3%;">
               INVOICE
            </td>
            <td style="width:33.3%; text-align: right;">
               Invoice No: 45377<br>
               Date: 26-03-2024<br>
               For: Project or Sales<br>
               Bill To: WHEELS EMI PVT LTD (070)<br>
               OFFICE NO 208 A WING SAGARTECH PLAZA<br>
               NEAR SAKINAKA METRO STATION<br>
               SAKINAKA MUMBAI 400072<br>  
               Bill To Phone: 9702422349/7977709326
            </td>
         </tr>
            </tr>
            <tr class="heading">
               <td>vehicle No</td>
               <td>Reference</td>
         
            </tr>
                    ${generateItemsRows(items)}

      
         </table>
         <br />
       
      </div>
   </body>
</html>
`;

const outputPath = 'sample.pdf'; // Specify the output file path

// htmlToPdf(htmlContent, outputPath);

app.listen(port, () => {
  console.log(`RTO app listening on port ${port}`)
})
>>>>>>> 9613839 (generate pdf)
