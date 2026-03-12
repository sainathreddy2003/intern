const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/purchase-bills');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const sanitizeFileToken = (value = '') =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const invoiceNo =
      sanitizeFileToken(req.body?.invoice_number) ||
      sanitizeFileToken(req.body?.invoiceNumber) ||
      sanitizeFileToken(req.body?.purchase_no) ||
      'invoice';
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${invoiceNo}_${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExt.has(ext)) {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    return;
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
