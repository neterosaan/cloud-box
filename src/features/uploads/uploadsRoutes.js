import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import * as uploadsController from './uploadsController.js';
import { uploadLimiter } from '../../middlewares/rateLimiters.js';

const router = express.Router();

router.use(requireAuth);
router.use(uploadLimiter);

router.post('/init', uploadsController.initUpload);
router.post('/:uploadId', uploadsController.streamUpload);

export default router;