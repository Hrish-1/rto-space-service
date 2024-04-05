import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    console.log("NODE_ENV", process.env.NODE_ENV)
    await mongoose.connect(`mongodb+srv://vigneshpaulraj4:I4h51UDvZTNcvyhn@cluster0.roaejqj.mongodb.net/rto
    `);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB
