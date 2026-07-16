import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import * as filesController from './filesController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:id/download', filesController.downloadFile);
router.patch('/:id', filesController.updateFile);
router.delete('/:id', filesController.deleteFile);
router.post('/:id/tags',filesController.attachTag);
router.delete('/:id/tags/:tagId',filesController.detachTag)

export default router;