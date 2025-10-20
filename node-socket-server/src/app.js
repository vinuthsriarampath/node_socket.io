import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import indexRoute from './routes/index-route.js';
import cors from 'cors';
import passport from 'passport';
import './config/passport.js';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {errorHandler} from "./middlewares/error-middleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser()); // Parse cookies from the request (this allow us to access the cookies in the request)
app.use(cors({
    origin: process.env.FRONTEND_URL, // Allow requests from this URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow these methods to be used in the request
    credentials: true, // Allow cookies to be sent in the request
}));
app.use(helmet({
    // Example CSP configuration; adjust as needed for your app (prevents inline scripts/styles, etc.)
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-eval'"], // Allow if needed for Angular
            // Add more directives as per your frontend needs
        }
    }
}));

app.use(passport.initialize());

app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', process.env.FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    next();
});

app.use("/uploads",express.static("uploads"));

app.use('/api', indexRoute);

app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use(errorHandler);

export default app;