import { Router } from "express";
import {authMiddleware} from "../middlewares/auth-middleware.js";
import {createGroup, getAllGroupsByUser} from "../controllers/group-controller.js";

const router = Router();

router.post('/',authMiddleware,createGroup);
router.get('/',authMiddleware,getAllGroupsByUser);

export default router;