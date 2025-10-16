import { UserDto } from '../dtos/user-Dto.js';
import * as userRepo from '../repositories/user-repositories.js';
import { ApiError } from '../exceptions/api-error.js';

export const getUserById = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) {
        throw new ApiError(404,"User Not Found!");
    }
    return new UserDto(user);
}

export const getAllUsersExceptMe = async (userId) => {
    let users = await  userRepo.getAllUsers();
    if (!users) {
        return [];
    }
    return users.map(user => new UserDto(user)).filter(user => user.id !== userId);
}