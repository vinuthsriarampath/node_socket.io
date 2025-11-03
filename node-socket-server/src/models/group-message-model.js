import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
    {
        groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
        message: { type: String, required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
        read: { type: Boolean, default: false },
        readAt: { type: Date, default: Date.now },
        type: { type: String, enum: ["text", "image", "video", "file"], default: "text" },
    },
    { timestamps: true }
);

export const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);
