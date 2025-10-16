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