import multer from 'multer';
import TransactionEntry from '../models/transaction.js';
import path from 'path';
import fs from 'fs';
import generateEntryID from '../utils.js';

// If using CommonJS modules elsewhere, you might need the following:
// const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Configure Multer and the storage path for uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     const userId = req.body.CustomerID; // Replace with how you get the userID
//     const uniqueSuffix = `${userId}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// export const upload = multer({ storage: storage }).array('documents', 4);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
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

export const createEntry = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // handle error
      return res.status(500).json({ message: 'File upload failed', error: err.message });
    }
    try {
      // Generate EntryID
      const entryID = generateEntryID();
      console.log(entryID, 'entryID')
      // Construct new entry data with generated EntryID
      const entryData = {
        EntryID: entryID,
        EntryDate: req.body.EntryDate,
        Status: req.body.Status,
        VehicleNo: req.body.VehicleNo,
        CustomerID: req.body.CustomerID,
        CustomerName: req.body.CustomerName,
        FromRTO: req.body.FromRTO,
        ToRTO: req.body.ToRTO,
        Services: req.body.Services,
        Amount: req.body.Amount,
        chasisProofPdfName: req.files['chasisProof'] ? req.files['chasisProof'][0].filename : undefined,
        insuranceProofPdfName: req.files['insuranceProof'] ? req.files['insuranceProof'][0].filename : undefined,
        pancardProofPdfName: req.files['pancardProof'] ? req.files['pancardProof'][0].filename : undefined,
        addressProofPdfName: req.files['addressProof'] ? req.files['addressProof'][0].filename : undefined,
      };
      const entry = new TransactionEntry(entryData);
      await entry.save();
      console.log(entry, 'entry')
      res.status(201).json({ message: 'Entry created successfully', entryId: entry.EntryID });
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
