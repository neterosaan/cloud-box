import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { uploadFile } from "./filesService.js"

const router = express.Router();

router.use(requireAuth);
router.post("/uploads/init", uploadFile);
router.post("/uploads/:uploadId", uploadFile);

export default router;