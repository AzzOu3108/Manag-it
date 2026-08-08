const rateLimit = require('express-rate-limit')

// strict limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, //10 minutes
    standardHeaders: true,
    max: 5, // 5 attempts per window
    legacyHeaders: false,
    message: {error: "Too many attempts. Please try again in 10 minutes."},
    skipSuccessfulRequests: true, // only failed attempts count
})

const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    message: {error: "TOO many requests from this IP address."}
})

module.exports = {authLimiter, apiLimiter}