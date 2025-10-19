import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
