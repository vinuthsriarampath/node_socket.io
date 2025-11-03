import * as groupMessageRepo from '../repositories/group-message-repository.js';

export const saveMessage = async (senderId, message,groupId ) => {
    const messageData =  {senderId, message, groupId};
    return groupMessageRepo.createMessage(messageData);
}

export async function getAllMessagesByGroupId(groupId, before, limit = 20) {
    const messages = await groupMessageRepo.getAllMessagesByGroupId(groupId, before, limit);
    return messages.reverse();
}

export const saveFileMessage = async (senderId, groupId, message, type) => {
    const messageData =  {senderId, groupId, message, type};
    return groupMessageRepo.createMessage(messageData);
}