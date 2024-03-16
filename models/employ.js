import mongoose from 'mongoose';

const employSchema = new mongoose.Schema({
    userName: { type: String, maxlength: 10 },
    email: { type: String, required: true, unique: true },
    employeeID: { type: Number, unique: true, sparse: true },
    password: { type: String, required: true }, // This ensures password won't be fetched by default
    firstName: { type: String, maxlength: 30 },
    middleName: { type: String, maxlength: 30 },
    lastName: { type: String, maxlength: 30 },
    gender: { type: String, enum: ['Male', 'Female', 'Others'] },
    birthDate: { type: Date },
    mobileNo: { type: Number },
    address: { type: String, maxlength: 240 },
    aadharNo: { type: Number, },
    pan: { type: String, maxlength: 10 },
    status: { type: String, enum: ['Active', 'Inactive'], },
    level: { type: Number, enum: [1, 2, 3], default: 3 },
    joiningDate: { type: Date },
    endDate: { type: Date, default: '9999-12-31' },
    photo: { type: Buffer }
}, { timestamps: true });
employSchema.index(
    { employeeID: 1 },
    { unique: true }
);

const Employ = mongoose.model('Employ', employSchema);

export default Employ;
