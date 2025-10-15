import { verifyToken } from "../utils/jwt.js";

export const authMiddleware = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ message: "No token" });

    const token = header.split(' ')[1];
    if(!token){
        res.status(403).json({message: "Token is missing!"})
    }
    try {
        const decoded = verifyToken(token);
        req.userId = decoded.id;
        next();
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
};