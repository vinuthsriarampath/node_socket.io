import { Router } from 'express';
import {getAllMessagesBetweenReceiver} from "../controllers/message-controller.js";
import {authMiddleware} from "../middlewares/auth-middleware.js";

const router = Router();

router.get('/:receiverId',authMiddleware,getAllMessagesBetweenReceiver)

export default router;