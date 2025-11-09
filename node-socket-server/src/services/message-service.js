import * as messageRepo from '../repositories/message-repository.js';
import {ApiError} from "../exceptions/api-error.js";

export const getAllMessagesBySenderIdAndReceiverId = async (currentUserId, receiverId, before, limit = 20) => {
    const messages = await messageRepo.getAllMessagesBySenderIdAndReceiverId(currentUserId, receiverId, before, limit);
    return messages.reverse();
}

export const saveMessage = async (senderId, receiverId, message) => {
    const messageData =  {senderId, receiverId, message};
    return messageRepo.createMessage(messageData);
}

export const saveFileMessage = async (senderId, receiverId, message, type) => {
    const messageData =  {senderId, receiverId, message, type};
    return messageRepo.createMessage(messageData);
}

export const markMessagesAsReadByUser = async (messageIds, userId) => {
    await messageRepo.markManyMessagesByUserAsRead(messageIds, userId);
}

export const getMessagesByMessageIdList = async (messageIds) => {
    const messages = await messageRepo.getMessagesByIds(messageIds);
    if(!messages){
        return [];
    }
    return messages;
}

export const countUnreadMessagesByUser = async (userId) => {
    const counts = await messageRepo.countUnreadMessagesByUser(userId);

    return counts.map(c => ({
        senderId: c._id.toString(),
        count: c.count,
    }))
}

const findMessageById = async (messageId) => {
    const message = await messageRepo.findById(messageId);
    if(!message){
        throw new ApiError(404, 'Message not found');
    }
    return message;
}

export const updateMessage = async (updatedMessage) => {
    const message = await findMessageById(updatedMessage._id);
    if (message.type !== 'text'){
        throw new ApiError(400, 'Message Must be a Text Message');
    }
    return await messageRepo.updateMessage(updatedMessage);
}

export const deleteMessage = async (messageId,userId)=> {
    const message = await findMessageById(messageId);
    if(!message){
        throw new ApiError(404, 'Message not found');
    }
    console.log("message",message);
    console.log("userId",userId);
    if(message.senderId.toString() !== userId){
        throw new ApiError(403, 'You are not authorized to delete this message');
    }
    return await messageRepo.deleteMessage(messageId);
}