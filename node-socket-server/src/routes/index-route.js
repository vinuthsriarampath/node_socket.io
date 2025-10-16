import express from 'express';
import userRoutes from './user-route.js';
import authRoutes from './auth-route.js';
import messageRoute from "./message-route.js";

const router =  express.Router();

router.use('/auth',authRoutes);
router.use('/users',userRoutes);
router.use('/messages',messageRoute);


export default router;