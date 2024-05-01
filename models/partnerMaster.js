import mongoose from 'mongoose'
const { Schema } = mongoose;

const partnerMasterSchema = new Schema({
    customerId: { type: Number, required: true },
    customerName: String,
    companyName: String,
    address: String,
    city: String,
    pincode: String,
    state: String,
    stateName: String,
    contactNo1: String,
    contactNo2: String,
    emailId: String,
    enteredBy: String,
    enteredOn: String,
    changedBy: String,
    changedOn: String
});

const partnerMaster = mongoose.model('partnerMaster', partnerMasterSchema);

export default partnerMaster;
