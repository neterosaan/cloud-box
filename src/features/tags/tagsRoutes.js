import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import * as tagsController from './tagsController.js';

const router = express.Router();

router.use(requireAuth)

router.post('/',tagsController.createTag)

router.get('/',tagsController.getTags)

router.delete('/:id',tagsController.deleteTag)


export default router