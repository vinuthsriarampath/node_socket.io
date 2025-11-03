import { verifyToken } from "../utils/jwt.js";
import * as messageService from "../services/message-service.js";
import * as groupService from "../services/group-service.js";
import * as groupMessageService from "../services/group-message-service.js";

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

                // deliver message if receiver online
                const receiverSocket = onlineUsers.get(toUserId);
                if (receiverSocket) {
                    io.to(toUserId.toString()).emit("receive_message", newMessage);

                    // 🔔 Send notification only if the user isn't chatting with the sender
                    io.to(toUserId.toString()).emit('notification', {
                        senderId: userId,
                        message: message.slice(0, 30),
                        createdAt: newMessage.createdAt,
                    });

                    // send the newest unread message count to the user after update
                    const unreadCount = await messageService.countUnreadMessagesByUser(toUserId);
                    io.to(toUserId).emit("unread_update", unreadCount);
                }

                // Emit confirmation to sender
                socket.emit("message_sent", newMessage);

            }catch (error){
                console.error("Error saving message:", error);
                socket.emit("error_saving_message", { error: "Message not saved" });
            }
        });

        socket.on("group_message", async ({ groupId, message }) => {
            try {
                const newMessage = await groupMessageService.saveMessage(userId, message, groupId);

                // Emit to all group members
                const group = await groupService.getGroupById(groupId);
                group.members.forEach((memberId) => {
                    const receiverSocket = onlineUsers.get(memberId.toString());
                    if (receiverSocket){
                        io.to(memberId.toString()).emit("receive_group_message", newMessage);

                        if(memberId.toString() !== userId){
                            io.to(memberId.toString()).emit('notification', {
                                senderId: userId,
                                message: message.slice(0, 30),
                                createdAt: newMessage.createdAt,
                            });
                        }
                    }
                });
            } catch (err) {
                console.error("Group message error:", err);
            }
        });

        socket.on("send_file_message", async (data) => {
            const { senderId, receiverId, fileUrl, type, groupId } = data

            let newMessage;

            if(groupId){
                console.log("groupId", groupId)
                newMessage = await groupMessageService.saveFileMessage(senderId, groupId, fileUrl, type);

                const group = await groupService.getGroupById(groupId);

                group.members.forEach((memberId) => {
                    const receiverSocket = onlineUsers.get(memberId.toString());
                    if(receiverSocket){
                        io.to(memberId.toString()).emit("receive_group_message", newMessage);

                        io.to(memberId.toString()).emit('notification', {
                            senderId: userId,
                            message: type,
                            createdAt: newMessage.createdAt,
                        })
                    }
                });
            }else{
                // Save message in DB
                newMessage = await messageService.saveFileMessage(senderId, receiverId, fileUrl , type);

                // deliver message if receiver online
                const receiverSocket = onlineUsers.get(receiverId);
                if (receiverSocket) {
                    io.to(receiverId.toString()).emit("receive_message", newMessage);

                    // 🔔 Send notification only if the user isn't chatting with the sender
                    io.to(receiverId.toString()).emit('notification', {
                        senderId: userId,
                        message: type,
                        createdAt: newMessage.createdAt,
                    });

                    // send the newest unread message count to the user after update
                    const unreadCount = await messageService.countUnreadMessagesByUser(receiverId);
                    io.to(receiverId).emit("unread_update", unreadCount);
                }
                // io.to(receiverId.toString()).emit("receive_message", newMessage);
            }

            socket.emit("message_sent", newMessage);
        });

        socket.on("mark_as_read", async ({ messageIds }) => {
            try {
                if (!Array.isArray(messageIds) || messageIds.length === 0) return;

                await messageService.markMessagesAsReadByUser(messageIds, userId);

                // Notify sender(s)
                const updatedMessages = await messageService.getMessagesByMessageIdList(messageIds);
                let senderId = null;
                updatedMessages.forEach((msg) => {
                    senderId = msg.senderId.toString();
                    io.to(msg.senderId.toString()).emit("message_read", {
                        _id: msg._id,
                        read: msg.read,
                        readAt: msg.readAt,
                    });
                });

                if(senderId){
                    // send the newest unread message count to the user after update
                    const unreadCount = await messageService.countUnreadMessagesByUser(userId);
                    socket.emit("unread_update", unreadCount);
                }
            } catch (err) {
                console.error("Error marking messages as read:", err);
            }
        });

        socket.on("on_group_create",async ({groupId})=>{
            try {
                console.log("on_group_create", groupId);
                const group = await groupService.getGroupById(groupId);
                group.members.forEach((memberId) => {
                    const receiverSocket = onlineUsers.get(memberId.toString());
                    if(receiverSocket){
                        io.to(memberId.toString()).emit("receive_new_group", group);
                    }
                })
            }catch (err){
                console.error("Error on group create:", err);
            }
        })

        // Notify when the user starts typing
        socket.on("typing", ({ toUserId }) => {
            io.to(String(toUserId)).emit("user_typing", { fromUserId: userId });
        });

        // Notify when the user stops typing
        socket.on("stop_typing", ({ toUserId }) => {
            io.to(String(toUserId)).emit("user_stopped_typing", { fromUserId: userId });
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