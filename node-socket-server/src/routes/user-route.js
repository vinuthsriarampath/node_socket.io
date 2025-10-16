import express from 'express';
import { authMiddleware } from '../middlewares/auth-middleware.js';
import {allUsersExceptMe, getCurrentUser} from '../controllers/user-controller.js';

const router =  express.Router();

router.get('/me',authMiddleware,getCurrentUser);
router.get('/all-except-me',authMiddleware,allUsersExceptMe);

export default router;