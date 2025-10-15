import { verifyToken } from "../utils/jwt.js";

export default function ChatSocket(io) {
    io.on("connection", (socket) => {
      const userId =
        socket.handshake.auth?.userId ||
        socket.handshake.query?.userId ||
        socket.id; // fallback for testing
  
      socket.user = { id: String(userId) };
  
      // Join a room named by this user's id so private messaging works
      socket.join(socket.user.id);
  
      console.log("User connected:", socket.user.id);
  
      socket.on("private_message", ({ toUserId, message }) => {
        io.to(String(toUserId)).emit("receive_message", {
          from: socket.user.id,
          message,
        });
      });
  
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.user.id);
      });
    });
}
