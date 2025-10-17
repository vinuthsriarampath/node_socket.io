import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
        read: { type: Boolean, default: false },
        readAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
