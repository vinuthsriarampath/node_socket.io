import * as messageService from '../services/message-service.js';

export const getAllMessagesBetweenReceiver = async (req,res,next)=> {
    try {
        const { receiverId } = req.params;
        const { before, limit = 20 } = req.query;
        const currentUserId = req.userId;

        const messages = await messageService.getAllMessagesBySenderIdAndReceiverId(currentUserId, receiverId, before, limit);
        res.json(messages);
    } catch (err) {
        return next(err)
    }
}

export const getCountOfUnreadMessagesByUser = async (req,res,next) => {
    try {
        const counts = await messageService.countUnreadMessagesByUser(req.userId);
        return res.json(counts);
    }catch (e) {
        return next(e);
    }
}