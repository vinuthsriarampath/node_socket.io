import * as groupService from '../services/group-service.js';

export const createGroup = async (req, res, next) => {
    try {
        const { name, members } = req.body;
        if(name && members.length > 0){
            const group = await groupService.createGroup(name, members, req.userId);
            return res.json(group);
        }
        return res.status(400).json(
            { message: "Name and members are required" }
        )
    }catch (e) {
        return next(e);
    }
}

export const getAllGroupsByUser = async (req, res, next) => {
    try{
        const groups =await groupService.getAllGroupsByUser(req.userId);
        return res.json(groups);
    }catch (e) {
        return next(e);
    }
}