import multer from 'multer';
import TransactionEntry from '../models/transaction.js';
import path from 'path';
import fs from 'fs';
import generateEntryID from '../utils.js';


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
      const entryID = await generateEntryID();
      console.log(entryID, 'entryID')
      // Construct new entry data with generated EntryID
      const entryData = {
        entryId: entryID,
        entryDate: req.body.entryDate,
        status: req.body.status,
        vehicleNo: req.body.vehicleNo,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        fromRTO: req.body.fromRTO,
        toRTO: req.body.toRTO,
        services: req.body.services,
        amount: req.body.amount,
        chasisProofPdfName: req.files['chasisProof'] ? `http://localhost:3027/uploads/${req.files['chasisProof'][0].filename}` : undefined,
        insuranceProofPdfName: req.files['insuranceProof'] ? `http://localhost:3027/uploads/${req.files['insuranceProof'][0].filename}` : undefined,
        pancardProofPdfName: req.files['pancardProof'] ? `http://localhost:3027/uploads/${req.files['pancardProof'][0].filename}` : undefined,
        addressProofPdfName: req.files['addressProof'] ? `http://localhost:3027/uploads/${req.files['addressProof'][0].filename}` : undefined,
      };
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



export const getEntry = async (req, res) => {

  let { page, size } = req.query;

  page = parseInt(page, 10) || 0;
  size = parseInt(size, 10) || 20;

  try {
    // Count total documents
    const totalItems = await TransactionEntry.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / size);

    // Find documents with pagination
    const items = await TransactionEntry.find()
      .skip(page * size)
      .limit(size);

    // Check if current page is first or last
    const isFirst = page === 0;
    const isLast = page === totalPages - 1;

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
    const entryID = req.query.entryId; // Assuming entryID is passed as a URL parameter
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