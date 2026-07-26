// apps/api-server/controllers/uploadController.js
// Handles local file uploads using base64 encoded streams.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../src/utils/logger');

/**
 * Upload any document, image, or CV locally (base64 payload)
 */
const uploadFile = async (req, res, next) => {
  try {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ message: 'fileName and fileData (base64) are required.' });
    }

    // Resolve public uploads directory
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Decode base64 file data
    // Remove base64 data URL prefix if present (e.g. "data:image/png;base64,")
    const base64Data = fileData.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Create unique file name to prevent collisions
    const ext = path.extname(fileName) || '.bin';
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Write file to local disk
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueName}`;
    logger.info({ msg: 'File uploaded successfully', fileName, uniqueName, url: relativeUrl });

    return res.status(201).json({
      message: 'File uploaded successfully.',
      url: relativeUrl,
      fileName: fileName
    });
  } catch (error) {
    logger.error('Error during file upload', { error: error.message });
    next(error);
  }
};

module.exports = {
  uploadFile
};
