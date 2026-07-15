import { fileParamsSchema, updateFileSchema } from './filesValidation.js';
import * as filesService from './filesService.js';

export const downloadFile = async (req, res) => {
  const validationResult = fileParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const result = await filesService.downloadFile(userId, id);

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

export const updateFile = async (req, res) => {
  const paramValidation = fileParamsSchema.safeParse(req.params);
  const bodyValidation = updateFileSchema.safeParse(req.body);

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
    const { id } = paramValidation.data;

    const updatedFile = await filesService.updateFile(userId, id, bodyValidation.data);

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

export const deleteFile = async (req, res) => {
  const validationResult = fileParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { id } = validationResult.data;

    const result = await filesService.deleteFile(userId, id);

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