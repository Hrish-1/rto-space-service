import mongoose  from 'mongoose';
const Schema = mongoose.Schema;

// Define the schema for bank information
const bankSchema = new Schema({
  bankId: {
    type: String,
    required: true
  },
  bank: {
    type: String,
    required: true
  },
  bankAddress: {
    type: String,
    required: true
  }
});

// Create a model from the schema
const Bank = mongoose.model('Bank', bankSchema);

export default Bank;
