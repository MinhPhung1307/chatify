import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connection to MongoDB: ${error.message}`);
        process.exit(1); // 1 status code means fail, 0 means success
    }
};