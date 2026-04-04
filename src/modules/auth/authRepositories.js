
import Token from "../../database/models/tokens.js";
import User from "../../database/models/User.js";
import Message from "../../database/models/Message.js";

const createUser = (data) => User.create(data);

const findUser = (query) => User.findOne(query);

const createToken = (token, userId, deviceId) => Token.create({ token, userId, deviceId });

const deleteToken = (token, userId) => Token.deleteOne({ token, userId });

const updateVerify = (id, updateData) => User.updateOne({ _id: id }, updateData);

const FindUserByID = (id) => User.findById(id);

const deleteOneToken = ({ userId, deviceId }) => Token.findOneAndDelete({ userId, deviceId });

const findToken = ({ userId, token }) => Token.findOne({ userId, token });

const updatedProfile = (userId, data) => 
  User.findByIdAndUpdate(userId, data, { new: true });

const changePassword = (userId, newPassword) =>
  User.findByIdAndUpdate(userId, { password: newPassword }, { new: true });


const createMessage = (data) => Message.create(data);

const getAllMessages = () => Message.find();

const findMessageAndDelete = (id) => Message.findByIdAndDelete(id);


const deleteUserComplete = async (userId) => {
  await Message.deleteMany({ 
    $or: [{ senderId: userId }, { receiverId: userId }] 
  });
  
 
  await Token.deleteMany({ userId });

  return await User.findByIdAndDelete(userId);
};



export {
  createUser,
  findUser,
  createToken,
  updateVerify,
  FindUserByID,
  deleteToken,
  findToken,
  deleteOneToken,
  updatedProfile,
  changePassword,
  createMessage,
  getAllMessages,
  findMessageAndDelete,
  deleteUserComplete
};