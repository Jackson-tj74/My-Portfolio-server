

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { StatusCodes } from 'http-status-codes';
import { handleError } from '../utils/responseUtils.js';

dotenv.config({ quiet: true });

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

const uploadService = async (req, res, next) => {
  const singleFile = req?.files?.avatar;
  const multipleFiles = req?.files?.attachments;

  // === Handle Single File ===
  if (singleFile) {
    const filename = singleFile.name || '';
    const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    const allowedSingleExtensions = ['.jpeg', '.jpg', '.png'];

    if (!allowedSingleExtensions.includes(extension)) {
      return handleError(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid file type. Accepted types for profile picture: .jpg, .png',
      );
    }

    try {
      const result = await cloudinary.uploader.upload(singleFile.path, {
        resource_type: 'image',
      });
      req.body.avatar = result.secure_url;
    } catch (error) {
      return handleError(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to upload profile picture. Please try again.',
      );
    }
  }

  // === Handle Multiple Files ===
  if (multipleFiles) {
    const filesArray = Array.isArray(multipleFiles)
      ? multipleFiles
      : [multipleFiles];
    const allowedMultiExtensions = ['.pdf', '.doc', '.docx'];
    const uploadedUrls = [];

    for (const file of filesArray) {
      const filename = file.name || '';
      const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase();

      if (!allowedMultiExtensions.includes(extension)) {
        return handleError(
          res,
          StatusCodes.BAD_REQUEST,
          'Invalid document type. Accepted types: .pdf, .doc, .docx',
        );
      }

      try {
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'raw',
        });
        uploadedUrls.push(result.secure_url);
      } catch (error) {
        return handleError(
          res,
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload document. Please try again.',
        );
      }
    }

    req.body.attachments = uploadedUrls;
  }

  return next();
};

export { uploadService };
