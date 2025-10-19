import {Message} from "../models/message-model.js";
import mongoose from "mongoose";

export const createMessage =  (messageData) => {
    const message = new Message(messageData);
    return message.save();
}

export const getAllMessagesBySenderIdAndReceiverId = (senderId, receiverId) => {
    return Message.find({
        $or: [
            {senderId: senderId, receiverId},
            {senderId: receiverId, receiverId: senderId},
        ],
    }).sort({createdAt: 1});
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