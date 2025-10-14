import rateLimit from 'express-rate-limit';


export const loginRateLimit = rateLimit({
    windowMs: 1000*60,
    max: 10,
    message: 'Too many requests from this IP, please try again later.'
})

export const registerRateLimit = rateLimit({
    windowMs: 1000*60*60,
    max: 5,
    message: 'Too many requests from this IP, please try again later.'
})