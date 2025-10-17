import * as userService from '../services/user-service.js';
import {getOnlineUsers} from "../sockets/chat-socket.js";

export const getCurrentUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const allUsersExceptMe = async (req,res,next)=> {
    try{
        const users = await userService.getAllUsersExceptMe(req.userId);
        res.status(200).json(users);
    }catch (err){
        next(err);
    }
}

export const getAllOnlineUsers = async (req,res,next) => {
    try{
        const onlineUsers = getOnlineUsers(req.userId);
        res.status(200).json(onlineUsers);
    }catch (err){
        next(err);
    }
}
