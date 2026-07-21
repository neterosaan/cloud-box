import { trashItemParamsSchema, trashItemTypeSchema } from './trashValidation.js';
import * as trashService from './trashService.js';

export const listTrash = async (req, res) => {
  if (req.query.type) {
    const validationResult = trashItemTypeSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        errors: validationResult.error.format(),
      });
    }
  }

  try {
    const userId = req.user.id;
    const result = await trashService.listTrash(userId, req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const restoreFile = async (req, res) => {
  const validationResult = trashItemParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const restoredFile = await trashService.restoreFile(userId, id);

    return res.status(200).json({
      success: true,
      data: restoredFile,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const restoreFolder = async (req, res) => {
  const validationResult = trashItemParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const result = await trashService.restoreFolder(userId, id);

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

export const permanentDeleteFile = async (req, res) => {
  const validationResult = trashItemParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const result = await trashService.permanentDeleteFile(userId, id);

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

export const permanentDeleteFolder = async (req, res) => {
  const validationResult = trashItemParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const result = await trashService.permanentDeleteFolder(userId, id);

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