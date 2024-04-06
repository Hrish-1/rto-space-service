import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({

    invoiceNo: { type: Number, required: true },
});

const InvoiceNumber = mongoose.model('InvoiceNumber', invoiceSchema);
export default InvoiceNumber;