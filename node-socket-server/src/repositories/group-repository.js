import {Group} from "../models/group-model.js";

export const findByGroupId = (groupId) => {
    return Group.findById(groupId);
}


export const createGroup = async (name, members, creatorId) => {
    return await Group.create({
        name,
        members: [...new Set([...members, creatorId])], // ensure creator included
        createdBy: creatorId,
    });
}

export const getAllGroupsByUser = (userId) => {
    return Group
        .find({ members: userId })
        .populate("members", "firstName lastName email");
}