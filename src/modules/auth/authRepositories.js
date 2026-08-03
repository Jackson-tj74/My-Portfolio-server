
import Token from "../../database/models/tokens.js";
import User from "../../database/models/User.js";
import Message from "../../database/models/Message.js";

const createUser = (data) => User.create(data);

const findUser = (query, includePassword = false) => {
  const request = User.findOne(query);
  return includePassword ? request.select("+password") : request;
};

const FindUserByID = (id) => User.findById(id);

const deleteOneToken = ({ userId, deviceId }) => Token.findOneAndDelete({ userId, deviceId });

const updatedProfile = (userId, data) =>
  User.findByIdAndUpdate(userId, data, { returnDocument: "after", runValidators: true });

const createMessage = (data) => Message.create(data);

const getAllMessages = (query = {}) => Message.find(query).sort({ createdAt: -1 });

const countMessages = (query = {}) => Message.countDocuments(query);

const updateMessage = (id, data) =>
  Message.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true });

const findMessageAndDelete = (id) => Message.findByIdAndDelete(id);

const deleteUserComplete = async (userId) => {
  await Token.deleteMany({ userId });
  return User.findByIdAndDelete(userId);
};

export {
  createUser,
  findUser,
  FindUserByID,
  deleteOneToken,
  updatedProfile,
  createMessage,
  getAllMessages,
  countMessages,
  updateMessage,
  findMessageAndDelete,
  deleteUserComplete,
};
