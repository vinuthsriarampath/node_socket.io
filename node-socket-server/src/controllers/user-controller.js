import * as userService from '../services/user-service.js';

export const getCurrentUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}