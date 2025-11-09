import * as messageService from '../services/message-service.js';
import {io} from "../server.js";

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

export const updateMessage =  async (req,res,next) => {
    try {
        const { message } = req.body;
        if(!message) return res.status(400).json({message: "Message is required"});
        if(message.senderId !== req.userId) return res.status(403).json({message: "You are not authorized to update this message"})
        const updatedMessage = await messageService.updateMessage(message);
        io.to(message.receiverId.toString()).emit("message-update", updatedMessage);
        return res.json(updatedMessage);
    }catch (e){
        return next(e);
    }
}

export const deleteMessage = async (req,res,next) => {
    try {
        const { messageId } = req.params;
        if (!messageId) return  res.status(400).json({message: "Message Id is required"});
        const deletedMessage = await messageService.deleteMessage(messageId,req.userId);
        io.to(deletedMessage.receiverId.toString()).emit("message-update", deletedMessage);
        return res.json(deletedMessage);
    }catch (e) {
        return next(e);
    }
}