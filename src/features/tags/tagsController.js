import { createTagSchema, tagParamsSchema, fileTagSchema, fileTagParamsSchema } from './tagsValidation.js';
import * as tagsService from './tagsService.js';

export const createTag = async (req, res) => {
  const validationResult = createTagSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { name } = validationResult.data;

    const tag = await tagsService.createTag(userId, name);

    return res.status(201).json({
      success: true,
      data: tag,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getTags = async (req, res) => {
  try {
    const userId = req.user.id;

    const tags = await tagsService.getTags(userId);

    return res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteTag = async (req, res) => {
  const validationResult = tagParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const result = await tagsService.deleteTag(userId, id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};


export const attachTag = async (req, res) => {
  const paramValidation = tagParamsSchema.safeParse(req.params);
  const bodyValidation = fileTagSchema.safeParse(req.body);

  if (!paramValidation.success || !bodyValidation.success) {
    return res.status(400).json({
      success: false,
      errors: {
        params: paramValidation.error?.format(),
        body: bodyValidation.error?.format(),
      },
    });
  }

  try {
    const userId = req.user.id;
    const { id: fileId } = paramValidation.data;
    const { tagId } = bodyValidation.data;

    const updatedFile = await tagsService.attachTag(userId, fileId, tagId);

    return res.status(200).json({
      success: true,
      data: updatedFile,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};


export const detachTag = async (req, res) => {
  const validationResult = fileTagParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id: fileId, tagId } = validationResult.data;

    const updatedFile = await tagsService.detachTag(userId, fileId, tagId);

    return res.status(200).json({
      success: true,
      data: updatedFile,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};