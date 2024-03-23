import mongoose from 'mongoose';

const serialNumberSchema = new mongoose.Schema({
  yearMonth: { type: String, required: true, unique: true },
  serial: { type: Number, required: true },
});

const SerialNumber = mongoose.model('SerialNumber', serialNumberSchema);
export default SerialNumber;
