import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config({ quiet: true });
const DATABASE_URL =process.env.DATABASE_URL;

mongoose.connect(DATABASE_URL)
.then(() => console.log('Mongodb connected successfully.'))
.catch((error) => console.log(`Mongodb error ${error}`))