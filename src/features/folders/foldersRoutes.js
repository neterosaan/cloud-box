import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import * as foldersController from '../folders/foldersController.js'
const router = express.Router();

router.use(requireAuth)

router.post('/',foldersController.createFolder);

router.get('/',foldersController.getFolder)

router.get('/:id', foldersController.getFolder)

router.patch('/:id', foldersController.updateFolder);

router.delete('/:id', foldersController.deleteFolder);

export default router;