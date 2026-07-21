import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import * as trashController from './trashController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/',                           trashController.listTrash);
router.post('/files/:id/restore',         trashController.restoreFile);
router.post('/folders/:id/restore',       trashController.restoreFolder);
router.delete('/files/:id',               trashController.permanentDeleteFile);
router.delete('/folders/:id',             trashController.permanentDeleteFolder);

export default router;