import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (user) => {
    return jwt.sign(
        {id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

export const generateRefreshToken = (user,fingerprint) => {
    return jwt.sign(
        { id: user.id, fingerprint }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    );
};

// Generate a device/browser fingerprint (hash of user-agent for binding; industry standard for token binding to prevent theft usage on other devices)
export const generateFingerprint = (userAgent) => {
    return crypto.createHash('sha256').update(userAgent || 'unknown').digest('hex');
};

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}