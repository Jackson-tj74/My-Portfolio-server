import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  service: String,
  message: String,
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);