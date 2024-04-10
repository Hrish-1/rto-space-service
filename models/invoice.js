import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: String,
    required: true,
  },
  customerID: {
    type: String,
    required: true,
    maxlength: 10
  },
  totalVehicles: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  receivedAmount: {
    type: mongoose.Types.Decimal128,
  },
  discount: {
    type: mongoose.Types.Decimal128,
  }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
