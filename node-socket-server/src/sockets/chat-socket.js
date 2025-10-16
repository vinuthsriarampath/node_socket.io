import { verifyToken } from "../utils/jwt.js";

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

        socket.join(userId); // private room per user

        console.log("Socket connected for user:", userId);

        socket.on("private_message", ({ toUserId, message }) => {
            // Optional: sanitize/validate message here
            io.to(String(toUserId)).emit("receive_message", {
                from: socket.user.id,
                message,
                timestamp: Date.now()
            });
        });

        socket.on("disconnect", (reason) => {
            console.log(`User disconnected: ${userId} — reason: ${reason}`);
        });
    });
}
