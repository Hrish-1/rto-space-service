import mongoose  from 'mongoose'

const Schema = mongoose.Schema;

const entrySchema = new Schema({
  EntryID: { type: String, length: 8, required: true, unique: true },
  EntryDate: { type: Date, required: true },
  Status: { type: String, length: 10, required: true },
  VehicleNo: { type: String, length: 12, required: true },
  CustomerID: { type: Number, required: true },
  CustomerName: { type: String, length: 100, required: true },
  FromRTO: { type: String, required: true }, // Assuming RTO is a string identifier
  ToRTO: { type: String, required: true },
  Services: { type: String, length: 240, required: true },
  Amount: { type: mongoose.Types.Decimal128, required: true },
  ChasisNo: String,
  BankID: String,
  LetterNo: String,
  LetterDate: Date,
  Note: String,
  InsuranceProof: String,
  ChasisProof: String,
  AddressProof: String,
  PancardProof: String,
  SellerName: String,
  SellerAddress: String,
  SellerSO: String,
  SellerMobile: String,
  PurchaserName: String,
  PurchaserAddress: String,
  PurchaserSO: String,
  PurchaserMobile: String,
  CreatedBy: String,
  ChallanPayment: String,
  ChallanNo: String,
  DeliveryNo: String,
  DeliveryDate: Date,
  DeliveryBy: String,
  OfficerPayment: String,
  CancelDate: Date,
  InvoiceNo: String,
  InvoiceDate: Date,
  InvoiceBy: String,
  chasisProofPdfName: { type: String },
  insuranceProofPdfName: { type: String },
  pancardProofPdfName: { type: String },
  addressProofPdfName: { type: String },
}, { timestamps: true }); // This option adds `createdAt` and `updatedAt` fields

const TransactionEntry = mongoose.model('Entry', entrySchema);
export default TransactionEntry