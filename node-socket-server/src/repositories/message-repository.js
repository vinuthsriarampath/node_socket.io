import {Message} from "../models/message-model.js";

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