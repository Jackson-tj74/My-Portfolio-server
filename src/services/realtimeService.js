let io;

export const registerSocketServer = (socketServer) => { io = socketServer; };

export const emitToUser = (userId, event, payload) => {
  if (io && userId) io.to(`user:${userId.toString()}`).emit(event, payload);
};
