import * as groupRepo from "../repositories/group-repository.js";
import {ApiError} from "../exceptions/api-error.js";

export const createGroup = async (name, members, creatorId)=>{
    return await groupRepo.createGroup(name, members, creatorId);
}

export const getAllGroupsByUser = async (userId) => {
    const groups = await groupRepo.getAllGroupsByUser(userId);
    if (!groups) {
        return [];
    }
    return groups;
}

export const getGroupById = async (groupId) => {
    const group = await groupRepo.findByGroupId(groupId);
    if(!group){
        throw new ApiError(404, 'Group not found');
    }
    return group;
}
