import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300,
  standardHeaders: true, 
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});


export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip, 
  message: { success: false, message: 'Upload limit reached. Please try again later.' },
});