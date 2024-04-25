import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const entrySchema = new Schema({
  entryId: { type: String, length: 8, required: true, unique: true },
  entryDate: { type: Date, required: true },
  status: { type: String, length: 10, required: true },
  vehicleNo: { type: String, length: 12, required: true },
  customerId: { type: Number, required: true },
  customerName: { type: String, length: 100, required: true },
  fromRTO: { type: String, required: true }, // Assuming RTO is a string identifier
  toRTO: { type: String, required: true },
  services: { type: String, length: 240, required: true },
  amount: { type: mongoose.Types.Decimal128, required: true },
  chasisNo: String,
  bankId: String,
  letterNo: String,
  letterDate: Date,
  note: String,
  insuranceProof: String,
  chasisProof: String,
  addressProof: String,
  pancardProof: String,
  sellerName: String,
  sellerAddress: String,
  sellerSO: String,
  sellerMobile: String,
  purchaserName: String,
  purchaserAddress: String,
  purchaserSO: String,
  purchaserMobile: String,
  createdBy: String,
  challanPayment: String,
  challanNo: String,
  deliveryNo: String,
  deliveryDate: Date,
  deliveryBy: String,
  officerPayment: String,
  cancelDate: Date,
  invoiceNo: String,
  invoiceDate: Date,
  invoiceBy: String,
  chasisProofPdfName: { type: String },
  insuranceProofPdfName: { type: String },
  pancardProofPdfName: { type: String },
  addressProofPdfName: { type: String },
  form30Part1: { type: String },
  form30part2: { type: String },
  form29: { type: String },
}, { timestamps: true }); // This option adds `createdAt` and `updatedAt` fields

const TransactionEntry = mongoose.model('Entry', entrySchema);
export default TransactionEntry;
