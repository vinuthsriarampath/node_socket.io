import * as messageRepo from '../repositories/message-repository.js';

export const getAllMessagesBySenderIdAndReceiverId = async (senderId, receiverId) => {
    const messages = await messageRepo.getAllMessagesBySenderIdAndReceiverId(senderId, receiverId);
    if(!messages){
        return [];
    }
    return messages;
}

export const saveMessage = async (senderId, receiverId, message) => {
    const messageData =  {senderId, receiverId, message};
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