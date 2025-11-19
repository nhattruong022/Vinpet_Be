import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { PhotoService } from '../services/PhotoService';

// Get absolute path for uploads directory
const getUploadDir = () => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'media');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadDir();
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
   *     tags:
   *       - Media
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
   *               postId:
   *                 type: string
   *               position:
   *                 type: integer
   *     responses:
   *       '200':
   *         description: File uploaded successfully
   *       '400':
   *         description: Bad request
   *       '500':
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
      const postId = req.body.postId || req.query.postId; // Nhận postId từ body hoặc query
      const position = parseInt(req.body.position) || 0; // Nhận position từ body, mặc định là 0
      const fileUrl = `/uploads/media/${file.filename}`;
      const filePath = path.join(getUploadDir(), file.filename);

      // Lưu thông tin file vào Photo model
      const photoData: any = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
        path: filePath,
        position: position,
        status: 'active' as const
      };

      // Chỉ thêm postId nếu có
      if (postId) {
        photoData.postId = postId;
      }

      // Chỉ thêm userId nếu có
      if (req.user?.id) {
        photoData.userId = req.user.id;
      }

      // Convert file to base64 and save to database
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const base64String = `data:${file.mimetype};base64,${base64Data}`;

      // Add base64 to photoData to save in database
      photoData.base64 = base64String;

      const savedPhoto = await PhotoService.createPhoto(photoData);

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: savedPhoto._id,
          filename: savedPhoto.filename,
          originalName: savedPhoto.originalName,
          mimetype: savedPhoto.mimetype,
          size: savedPhoto.size,
          base64: base64String,
          postId: savedPhoto.postId,
          position: savedPhoto.position,
          photoId: savedPhoto._id
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
   * /api/media/{id}:
   *   delete:
   *     summary: Delete media file
   *     tags: [Media]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Photo ID
   *     responses:
   *       200:
   *         description: Media file deleted successfully
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
   *         description: Media file not found
   *       500:
   *         description: Internal server error
   */
  static async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid photo ID'
        });
        return;
      }

      // Get photo info first
      const photo = await PhotoService.getPhotoById(id);
      if (!photo) {
        res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
        return;
      }

      // Delete the file from filesystem
      if (photo.path) {
        // Handle both relative and absolute paths
        let filePath = photo.path;
        if (!path.isAbsolute(filePath)) {
          filePath = path.join(process.cwd(), filePath);
        }

        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (fileError) {
            console.error('Error deleting file:', fileError);
            // Continue with database deletion even if file deletion fails
          }
        }
      }

      // Delete from database using PhotoService
      const deleted = await PhotoService.deletePhoto(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Media file deleted successfully'
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
