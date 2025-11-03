import * as groupMessageService from "../services/group-message-service.js";

export const getAllMessagesByGroupId = async (req,res,next)=> {
    try {
        const {groupId} = req.params;
        const {before, limit = 20} = req.query;

        const messages = await groupMessageService.getAllMessagesByGroupId(groupId, before, limit);
        return res.json(messages);
    } catch (e) {
        return next(e);
    }
}