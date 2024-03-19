import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const {DB_HOST, DB_PASSWD, CLUSTER_NAME, DB_NAME}=process.env

const MONGODB_URI =`mongodb+srv://${DB_HOST}:${DB_PASSWD}@${CLUSTER_NAME}/${DB_NAME}`

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    });
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB