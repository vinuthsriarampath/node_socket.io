import { Router } from 'express';
import {
    deleteMessage,
    getAllMessagesBetweenReceiver,
    getCountOfUnreadMessagesByUser,
    updateMessage
} from "../controllers/message-controller.js";
import {authMiddleware} from "../middlewares/auth-middleware.js";

const router = Router();

router.get('/unread',authMiddleware,getCountOfUnreadMessagesByUser);
router.get('/:receiverId',authMiddleware,getAllMessagesBetweenReceiver);
router.patch('/update',authMiddleware,updateMessage);
router.delete('/delete/:messageId',authMiddleware,deleteMessage)

export default router;