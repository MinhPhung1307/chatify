import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const { MONGGO_URI } = process.env;
        if (!MONGGO_URI) throw new Error('MONGGO_URI is not set');

        const conn = await mongoose.connect(MONGGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connection to MongoDB: ${error.message}`);
        process.exit(1); // 1 status code means fail, 0 means success
    }
};