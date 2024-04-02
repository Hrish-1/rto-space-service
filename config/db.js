import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log("NODE_ENV", process.env.NODE_ENV)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB
