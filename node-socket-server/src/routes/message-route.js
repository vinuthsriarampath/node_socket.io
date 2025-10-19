import { Router } from 'express';
import {getAllMessagesBetweenReceiver, getCountOfUnreadMessagesByUser} from "../controllers/message-controller.js";
import {authMiddleware} from "../middlewares/auth-middleware.js";

const router = Router();

router.get('/unread',authMiddleware,getCountOfUnreadMessagesByUser);
router.get('/:receiverId',authMiddleware,getAllMessagesBetweenReceiver);

export default router;