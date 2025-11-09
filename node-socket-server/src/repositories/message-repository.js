import {Message} from "../models/message-model.js";
import mongoose from "mongoose";

export async function deleteMessage(messageId) {
    return Message.findByIdAndUpdate(
        messageId,
        { $set: { deleted : true } },
        { new: true }
    ).exec();
}


export async function updateMessage(updatedMessage) {
    return Message.findByIdAndUpdate(
        updatedMessage._id,
        { $set: { message: updatedMessage.message } },
        { new: true }
    ).exec();
}

export async function findById(messageId) {
    return Message.findById(messageId);
}


export const createMessage =  (messageData) => {
    const message = new Message(messageData);
    return message.save();
}

export const getAllMessagesBySenderIdAndReceiverId = (currentUserId, receiverId, before, limit) => {
    const query = {
        $or: [
            { senderId: currentUserId, receiverId: receiverId },
            { senderId: receiverId, receiverId: currentUserId }
        ]
    };

    if (before) query.createdAt = { $lt: new Date(before) };

    return Message.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
}

export const markManyMessagesByUserAsRead =async (messageIds,userId) => {
    await Message.updateMany(
        { _id: { $in: messageIds }, receiverId: userId },
        { $set: { read: true, readAt: new Date() } }
    )
}

export const getMessagesByIds = (messageIds) => {
    return Message.find(
        { _id: { $in: messageIds } }
    );
}

export const countUnreadMessagesByUser = (userId) => {
    return Message.aggregate([
        { $match: { receiverId:new mongoose.Types.ObjectId(userId), read: false } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ])
}