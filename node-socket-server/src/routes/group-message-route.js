import { Router } from 'express';
import {authMiddleware} from "../middlewares/auth-middleware.js";
import {getAllMessagesByGroupId} from "../controllers/group-message-controller.js";

const router = Router();

router.get('/:groupId',authMiddleware,getAllMessagesByGroupId);

export default router;