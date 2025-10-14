import express from 'express';
import passport from 'passport';
import { login, register, refreshToken, logout, socialCallback } from '../controllers/auth-controller.js';
import { loginRateLimit, registerRateLimit } from '../middlewares/ratelimit-middleware.js';

const router =  express.Router();

router.post('/register',registerRateLimit,register);
router.post('/login',loginRateLimit,login);
router.post('/refresh',refreshToken);
router.post('/logout',logout);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { session: false, failureRedirect: process.env.FRONTEND_URL + "/login" }),socialCallback);

router.get('/github',passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate("github", { session: false, failureRedirect: process.env.FRONTEND_URL + "/login" }),socialCallback);

router.get('/facebook',passport.authenticate('facebook', { scope: ['public_profile','email'] }));
router.get('/facebook/callback', passport.authenticate("facebook", { session: false, failureRedirect: process.env.FRONTEND_URL + "/login" }),socialCallback);

export default router;