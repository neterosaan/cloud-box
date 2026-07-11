import { initUploadSchema, uploadIdParamsSchema } from './uploadsValidation.js';
import * as uploadsService from './uploadsService.js';

export const initUpload = async (req, res) => {
  const validationResult = initUploadSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { fileName, folderId } = validationResult.data;

    const session = await uploadsService.initUploadSession(userId, fileName, folderId);

    return res.status(201).json({
      success: true,
      uploadId: session.id,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};


export const streamUpload = async (req, res) => {
  const validationResult = uploadIdParamsSchema.safeParse(req.params);
  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      errors: validationResult.error.format(),
    });
  }

  try {
    const userId = req.user.id;
    const { uploadId } = validationResult.data;

    // req itself is passed through — it IS the multipart stream.
    // The service layer hands it to Busboy; the controller never parses it.
    const file = await uploadsService.handleUploadStream(userId, uploadId, req);

    return res.status(201).json({
      success: true,
      file,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message,
    });
  }
};
