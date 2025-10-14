import { UserDto } from '../dtos/user-Dto.js';
import * as userRepo from '../repositories/user-repositories.js';
import { ApiError } from '../exceptions/api-error.js';

export const getUserById = async (userId) => {
    const user = await userRepo.findById(userId);
    if (!user) {
        new ApiError(404,"User Not Found!");
    }
    return new UserDto(user);
}