import multer from 'multer';
import TransactionEntry from '../models/transaction.js';
import path from 'path';
import fs from 'fs';
import generateEntryID from '../utils.js';


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

    const [ { totalItems } ] = await TransactionEntry
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
