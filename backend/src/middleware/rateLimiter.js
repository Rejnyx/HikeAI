import rateLimit from 'express-rate-limit';

// General rate limiting - prevent DoS attacks
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for route generation (expensive operation)
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_ROUTES || 20, // Only 20 route generations per 15 minutes
  message: {
    error: 'Too Many Requests',
    message: 'Too many route generation requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
