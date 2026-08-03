import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not configured. Set it in your .env file.");
  process.exit(1);
}

mongoose.set("strictQuery", true);

const connectDatabase = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to avoid DNS resolution issues on Render
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (error) => {
  console.error(`MongoDB error: ${error.message}`);
});

export { connectDatabase, mongoose };
export default mongoose;