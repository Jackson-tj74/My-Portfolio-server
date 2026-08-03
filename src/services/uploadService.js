import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import { handleError } from "../utils/responseUtils.js";

dotenv.config({ quiet: true });

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const validateFileSize = (file, res) => {
  if (file?.size && file.size > MAX_FILE_SIZE) {
    handleError(res, StatusCodes.BAD_REQUEST, "File size exceeds the 10 MB limit.");
    return false;
  }
  return true;
};

const getExtension = (filename = "") =>
  filename.slice(filename.lastIndexOf(".")).toLowerCase();

const uploadToCloudinary = async (file, options = {}) => {
  return cloudinary.uploader.upload(file.path, { resource_type: "image", ...options });
};

const uploadService = async (req, res, next) => {
  const singleFile = req?.files?.avatar;
  const projectImage = req?.files?.projectImage;
  const contentIcon = req?.files?.contentIcon;
  const settingImage = req?.files?.settingImage;
  const multipleFiles = req?.files?.attachments;

  // === Handle Single File (Profile Avatar) ===
  if (singleFile) {
    if (!validateFileSize(singleFile, res)) return;
    const extension = getExtension(singleFile.name);
    if (![".jpeg", ".jpg", ".png"].includes(extension)) {
      return handleError(res, StatusCodes.BAD_REQUEST, "Invalid file type. Accepted types for profile picture: .jpg, .png");
    }
    try {
      const result = await uploadToCloudinary(singleFile);
      req.body.avatar = result.secure_url;
    } catch {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload profile picture. Please try again.");
    }
  }

  // === Handle Project Image ===
  if (projectImage) {
    if (!validateFileSize(projectImage, res)) return;
    const extension = getExtension(projectImage.name);
    if (![".jpeg", ".jpg", ".png", ".webp"].includes(extension)) {
      return handleError(res, StatusCodes.BAD_REQUEST, "Invalid project image type. Accepted types: .jpg, .png, .webp");
    }
    try {
      const result = await uploadToCloudinary(projectImage);
      req.body.image = result.secure_url;
    } catch {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload project image. Please try again.");
    }
  }

  // === Handle Content Icon ===
  if (contentIcon) {
    if (!validateFileSize(contentIcon, res)) return;
    const extension = getExtension(contentIcon.name);
    if (![".jpeg", ".jpg", ".png", ".webp", ".svg"].includes(extension)) {
      return handleError(res, StatusCodes.BAD_REQUEST, "Invalid icon type. Accepted types: .jpg, .png, .webp, .svg");
    }
    try {
      const result = await uploadToCloudinary(contentIcon, { folder: "portfolio/content-icons" });
      if (typeof req.body.data === "string") {
        try { req.body.data = JSON.parse(req.body.data); }
        catch { return handleError(res, StatusCodes.BAD_REQUEST, "Custom data must be valid JSON"); }
      }
      req.body.data = { ...(req.body.data || {}), icon: result.secure_url };
    } catch {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload content icon. Please try again.");
    }
  }

  // === Handle Setting Image ===
  if (settingImage) {
    if (!validateFileSize(settingImage, res)) return;
    const extension = getExtension(settingImage.name);
    if (![".jpeg", ".jpg", ".png", ".webp"].includes(extension)) {
      return handleError(res, StatusCodes.BAD_REQUEST, "Invalid profile image type. Accepted types: .jpg, .png, .webp");
    }
    try {
      const result = await uploadToCloudinary(settingImage, { folder: "portfolio/about" });
      req.body.value = result.secure_url;
    } catch {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload profile image. Please try again.");
    }
  }

  // === Handle Multiple Files (Documents) ===
  if (multipleFiles) {
    const filesArray = Array.isArray(multipleFiles) ? multipleFiles : [multipleFiles];
    const allowedMultiExtensions = [".pdf", ".doc", ".docx"];
    const uploadedUrls = [];

    for (const file of filesArray) {
      if (!validateFileSize(file, res)) return;
      const extension = getExtension(file.name);
      if (!allowedMultiExtensions.includes(extension)) {
        return handleError(res, StatusCodes.BAD_REQUEST, "Invalid document type. Accepted types: .pdf, .doc, .docx");
      }
      try {
        const result = await cloudinary.uploader.upload(file.path, { resource_type: "raw" });
        uploadedUrls.push(result.secure_url);
      } catch {
        return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload document. Please try again.");
      }
    }

    req.body.attachments = uploadedUrls;
  }

  return next();
};

export { uploadService };