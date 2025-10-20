import { Router } from 'express';
import {authMiddleware} from "../middlewares/auth-middleware.js";
import {upload} from "../utils/file-upload.js";
import {fileUpload} from "../controllers/file-controller.js";

const router = Router();

router.post('/chat/upload', authMiddleware, upload.single('file'), fileUpload);

export default router;