import express from 'express';
import userRoutes from './user-route.js';
import authRoutes from './auth-route.js';
import messageRoute from "./message-route.js";
import fileRoute from "./file-route.js";
import groupRoute from "./group-route.js";
import groupMessageRoute from "./group-message-route.js";

const router =  express.Router();

router.use('/auth',authRoutes);
router.use('/users',userRoutes);
router.use('/messages',messageRoute);
router.use('/files', fileRoute);
router.use('/groups', groupRoute);
router.use('/messages/groups', groupMessageRoute);

export default router;