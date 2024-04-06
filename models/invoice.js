import mongoose from 'mongoose';
const invoiceSchema = new mongoose.Schema({
    InvoiceNo: {
      type: String,
      required: true,
      unique: true
    },
    InvoiceDate: {
      type: String,
      required: true,
    },
    CustomerID: {
      type: String,
      required: true,
      maxlength: 10
    },
    TotalVehicles: {
      type: Number,
      required: true,

    },
    TotalAmount: {
      type: mongoose.Types.Decimal128,
      required: true,

    },
    ReceivedAmount: {
      type: mongoose.Types.Decimal128,
    },
    Discount: {
      type: mongoose.Types.Decimal128,       
    }
  }, { timestamps: true });
  
  const Invoice = mongoose.model('Invoice', invoiceSchema);
  export default Invoice;