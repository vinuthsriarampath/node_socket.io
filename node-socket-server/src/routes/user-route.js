import express from 'express';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import {allUsersExceptMe, getAllOnlineUsers, getCurrentUser} from '../controllers/user-controller.js';

const router =  express.Router();

router.get('/me',authMiddleware,getCurrentUser);
router.get('/all-except-me',authMiddleware,allUsersExceptMe);
router.get('/online',authMiddleware,getAllOnlineUsers)

export default router;