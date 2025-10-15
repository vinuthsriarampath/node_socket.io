import * as userValidator from '../validators/user-registration-validation-schema.js';
import * as authService from '../services/auth-service.js';
import * as userService from '../services/user-service.js';
import { ApiError } from '../exceptions/api-error.js';
import passport from 'passport';
import { generateAccessToken, generateFingerprint, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { redisClient } from '../server.js';

export const register = async (req, res, next) => {
    try {
        const { error } = userValidator.userRegistrationSchema.validate(req.body);
        if (error) throw new ApiError(400, error.details[0].message);

        const userDto = await authService.register(req.body);
        res.status(201).json(userDto);

    } catch (error) {
        next(error)
    }
}

export const login = async (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || 'Unauthorized' });
        req.login(user, { session: false }, (loginErr) => {

            // Returns the error thrown by the passport.js 
            if (loginErr) return next(loginErr);

            // Generate fingerprint based on user-agent header
            const fingerprint = generateFingerprint(req.headers['user-agent']);

            // Generate a short lived access token if user is successfully authenticated
            const accessToken = generateAccessToken(user);

            // Generate a long lived refresh token
            const refreshToken = generateRefreshToken(user, fingerprint);

            // Set the refresh token as a cookie in the response
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true, // This is to prevent the cookie from being accessed by the client side javascript
                secure: process.env.NODE_ENV === 'production', // This is to ensure that the cookie is only sent over HTTPS in production
                sameSite: 'Strict', // This is to prevent CSRF attacks
                path: '/api/auth', // This is the path that the refresh token will be sent to
                // maxAge: 1000 * 60 * 60 * 24 * 30  this is handled by the JWT itself
            });

            return res.json({ accessToken });
        });
    })(req, res, next);
}

export const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    // Check if token is blacklisted (revocation; industry standard using Redis for fast, expiring storage)
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) return res.status(403).json({ message: "Refresh token is blacklisted!" });

    try {
        const decoded = verifyToken(token);

        // Added: Verify fingerprint matches current request (ensures token bound to same client/device)
        const currentFingerprint = generateFingerprint(req.headers['user-agent']);
        if (decoded.fingerprint !== currentFingerprint) {
            return res.status(403).json({ message: "Invalid device fingerprint" });
        }

        // Find the user to ensure they still exist
        const user = await userService.getUserById(decoded.id);
        if (!user) return res.status(403).json({ message: "User not found" });

        // Regenerate fingerprint for new refresh token (rotation)
        const newFingerprint = generateFingerprint(req.headers['user-agent']);

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user, newFingerprint);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "Strict",
            path: "/api/auth"
        });

        res.json({ accessToken });
    } catch (error) {
        new ApiError(401, error.message);
    }
}


export const logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (token) {
        try {
            // Blacklist the refresh token in Redis (revocation; expires automatically after token's remaining time)
            const decoded = verifyToken(token); // Decode without verify to get exp
            if (decoded && decoded.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000); // Remaining seconds
                if (ttl > 0) {
                    await redisClient.set(`blacklist:${token}`, 'true', { EX: ttl });
                    console.log(`Blacklisted token in Redis: blacklist:${token} with TTL ${ttl}s`); // Added: Log for verification
                }
            }
        } catch (err) {
            throw new ApiError(500, `Error blacklisting token: ${err}`)
        }
    }
    res.clearCookie("refreshToken", { path: 'api/auth' });
    res.json({ message: "Logged out!" })
}


export const socialCallback = (req, res) => {

    // Added: Generate fingerprint for Social login as well
    const fingerprint = generateFingerprint(req.headers['user-agent']);

    const refreshToken = generateRefreshToken(req.user, fingerprint);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "Strict", // Updated to "Strict"
        path: "/api/auth"
    });

    // Redirect to SPA with token in URL fragment (or just let SPA call refresh endpoint)
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);

}