import express from 'express';
import userRoutes from './user-route.js';
import authRoutes from './auth-route.js';

const router =  express.Router();

router.use('/auth',authRoutes);
router.use('/users',userRoutes);


export default router;