import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
        read: { type: Boolean, default: false },
        deleted: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        type: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
