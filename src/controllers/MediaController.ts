import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/media';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export class MediaController {
  /**
   * @swagger
   * /api/media/upload:
   *   post:
   *     summary: Upload media file
   *     tags: [Media]
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: Image file to upload
   *     responses:
   *       200:
   *         description: File uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     filename:
   *                       type: string
   *                     originalName:
   *                       type: string
   *                     mimetype:
   *                       type: string
   *                     size:
   *                       type: integer
   *                     url:
   *                       type: string
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  static async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
        return;
      }

      const file = req.file;
      const fileUrl = `/uploads/media/${file.filename}`;

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: file.filename,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: fileUrl
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/media/{filename}:
   *   get:
   *     summary: Get media file info
   *     tags: [Media]
   *     parameters:
   *       - in: path
   *         name: filename
   *         required: true
   *         schema:
   *           type: string
   *         description: Media filename
   *     responses:
   *       200:
   *         description: Media info retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     filename:
   *                       type: string
   *                     url:
   *                       type: string
   *                     exists:
   *                       type: boolean
   *       404:
   *         description: Media not found
   *       500:
   *         description: Internal server error
   */
  static async getMediaInfo(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
        return;
      }
      const filePath = path.join('uploads/media', filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
        return;
      }

      const stats = fs.statSync(filePath);
      const fileUrl = `/uploads/media/${filename}`;

      res.status(200).json({
        success: true,
        message: 'Media info retrieved successfully',
        data: {
          filename,
          url: fileUrl,
          exists: true,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/media/{filename}:
   *   delete:
   *     summary: Delete media file
   *     tags: [Media]
   *     parameters:
   *       - in: path
   *         name: filename
   *         required: true
   *         schema:
   *           type: string
   *         description: Media filename
   *     responses:
   *       200:
   *         description: Media deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         description: Media not found
   *       500:
   *         description: Internal server error
   */
  static async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      if (!filename) {
        res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
        return;
      }
      const filePath = path.join('uploads/media', filename);

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
        return;
      }

      fs.unlinkSync(filePath);

      res.status(200).json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Multer middleware
  static uploadMiddleware = upload.single('file');
}
