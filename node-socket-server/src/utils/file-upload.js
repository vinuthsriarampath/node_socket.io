import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = path.join(process.cwd(), "uploads", "chat");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

export const upload = multer({ storage });
