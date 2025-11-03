import {GroupMessage} from "../models/group-message-model.js";

export const createMessage =  (messageData) => {
    const message = new GroupMessage(messageData);
    return message.save();
}

export async function getAllMessagesByGroupId(groupId, before, limit) {
    const query = { groupId };
    if (before) query.createdAt = { $lt: new Date(before) };
    return GroupMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
}
