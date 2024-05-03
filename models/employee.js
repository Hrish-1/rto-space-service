import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const employeeSchema = new mongoose.Schema({
  userName: { type: String, maxlength: 10 },
  email: { type: String, required: true, unique: true },
  employeeID: { type: Number, unique: true, sparse: true },
  password: { type: String, required: true }, // This ensures password won't be fetched by default
  firstName: { type: String, maxlength: 30 },
  middleName: { type: String, maxlength: 30 },
  lastName: { type: String, maxlength: 30 },
  gender: { type: String, enum: ['Male', 'Female', 'Others'] },
  birthDate: { type: Date },
  mobileNo: { type: String },
  address: { type: String, maxlength: 240 },
  aadharNo: { type: String },
  pan: { type: String, maxlength: 10 },
  status: { type: String, enum: ['Active', 'Inactive'], },
  level: { type: Number, enum: [1, 2, 3], default: 3 },
  joiningDate: { type: Date },
  endDate: { type: Date, default: '9999-12-31' },
  photo: { type: Buffer }
}, { timestamps: true });
employeeSchema.index(
  { employeeID: 1 },
  { unique: true }
);

// Match user entered password to hashed password in database
employeeSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt before saving employee to the db
employeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.pre(["updateOne", "findByIdAndUpdate", "findOneAndUpdate"], async function(next) {
  const data = this.getUpdate();
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
  }
  next()

});

const Employee = mongoose.model('Employee', employeeSchema);

export default Employee;
