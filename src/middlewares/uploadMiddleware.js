import multer from "multer";
import os from "node:os";

// Use disk storage to match previous connect-multiparty behavior
// (files written to temp dir, path available for Cloudinary upload)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = file.originalname.slice(file.originalname.lastIndexOf("."));
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 10, // max 10 files per request
  },
});

// Accept any fields and normalize req.files to match the object format
// expected by uploadService (same shape as connect-multiparty)
const multipart = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return next(err);
    }
    // Normalize: multer gives req.files as an array; convert to object keyed by fieldname
    if (Array.isArray(req.files)) {
      const filesObject = {};
      for (const file of req.files) {
        // If multiple files with same fieldname, wrap in array (like connect-multiparty)
        if (filesObject[file.fieldname]) {
          if (!Array.isArray(filesObject[file.fieldname])) {
            filesObject[file.fieldname] = [filesObject[file.fieldname]];
          }
          filesObject[file.fieldname].push(file);
        } else {
          filesObject[file.fieldname] = file;
        }
      }
      // Add .name alias for .originalname (connect-multiparty used .name)
      for (const key of Object.keys(filesObject)) {
        const entry = filesObject[key];
        if (Array.isArray(entry)) {
          entry.forEach((f) => { f.name = f.originalname; });
        } else {
          entry.name = entry.originalname;
        }
      }
      req.files = filesObject;
    }
    next();
  });
};

export { multipart, upload };
export default multipart;