
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  
  name:{type:String},
  email: { type: String, unique: true },
  password: String,
  role:{type:String,enum:"provider",default:"provider"},
  location:{type:String,default:null},
  phone:{type:Number,default:null},
  avatar:{type:String,default:null},
  createAt:{type:Date,default:Date.now()}
}, { timestamps: true });

export default mongoose.model("User", UserSchema);