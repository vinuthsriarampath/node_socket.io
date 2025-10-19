import * as messageService from '../services/message-service.js';

export const getAllMessagesBetweenReceiver = async (req,res,next)=> {
    try {
        const { receiverId } = req.params;
        const messages = await messageService.getAllMessagesBySenderIdAndReceiverId(req.userId, receiverId);
        return res.json(messages);
    } catch (err) {
        return next(err)
    }
}

export const getCountOfUnreadMessagesByUser = async (req,res,next) => {
    try {
        const counts = await messageService.countUnreadMessagesByUser(req.userId);
        console.log(counts);
        return res.json(counts);
    }catch (e) {
        return next(e);
    }
}