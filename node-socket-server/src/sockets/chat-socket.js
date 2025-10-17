import { verifyToken } from "../utils/jwt.js";
import * as messageService from "../services/message-service.js";

const onlineUsers = new Map();

export default function ChatSocket(io) {


    // Middleware to authenticate socket handshake
    io.use((socket, next) => {
        try {
            // Expect token in handshake auth: { token: 'Bearer <jwt>' } or just token
            let token = socket.handshake.auth?.token || socket.handshake.query?.token;

            if (!token) {
                // no token provided
                return next(new Error("unauthorized"));
            }

            // If client sends "Bearer <jwt>", strip prefix
            if (token.startsWith && token.toLowerCase().startsWith("bearer ")) {
                token = token.split(" ")[1];
            }

            // verifyToken should throw if invalid/expired
            const payload = verifyToken(token); // payload { id, email } for access token

            // Attach authenticated user info to socket
            socket.user = { id: String(payload.id), email: payload.email };

            return next();
        } catch (err) {
            console.error("Socket auth error:", err?.message || err);
            return next(new Error("unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        // Socket is authenticated at this point
        const userId = socket.user.id;

        // Add user to the online list
        onlineUsers.set(userId, socket.id);

        // Notify online users to all connected clients
        io.emit("user_status_change", { userId, status: "online" });

        socket.join(userId); // private room per user

        console.log("Socket connected for user:", userId);

        socket.on("private_message", async ({ toUserId, message }) =>{
            try{
                // Save message in DB
                const newMessage = await messageService.saveMessage(userId, toUserId, message);

                // Emit to receiver if online
                io.to(toUserId.toString()).emit("receive_message", newMessage);

                // Emit confirmation to sender
                socket.emit("message_sent", newMessage);

            }catch (error){
                console.error("Error saving message:", error);
                socket.emit("error_saving_message", { error: "Message not saved" });
            }
        });

        socket.on("disconnect", (reason) => {
            //remove user from online list
            onlineUsers.delete(userId);

            // Notify online users to all connected clients
            io.emit("user_status_change", { userId, status: "offline" });

            console.log(`User disconnected: ${userId} — reason: ${reason}`);
        });
    });
}

export const getOnlineUsers = () => Array.from(onlineUsers.keys());