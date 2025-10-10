import { Photo, IPhoto } from '../models/Photo';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export interface PhotoCreateData {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  alt?: string;
  caption?: string;
  position?: number;
  postId?: string;
  userId?: string;
  altText?: string;
  title?: string;
}

export class PhotoService {
  /**
   * Create a new photo record
   */
  static async createPhoto(photoData: PhotoCreateData): Promise<IPhoto> {
    try {
      const photo = new Photo(photoData);
      return await photo.save();
    } catch (error: any) {
      throw new Error(`Failed to create photo: ${error.message}`);
    }
  }

  /**
   * Get photo by ID
   */
  static async getPhotoById(id: string): Promise<IPhoto | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      return await Photo.findById(id)
        .populate('postId', 'title slug')
        .populate('userId', 'firstName lastName email');
    } catch (error: any) {
      throw new Error(`Failed to get photo: ${error.message}`);
    }
  }

  /**
   * Get photo by filename
   */
  static async getPhotoByFilename(filename: string): Promise<IPhoto | null> {
    try {
      return await Photo.findOne({ filename, status: 'active' })
        .populate('postId', 'title slug')
        .populate('userId', 'firstName lastName email');
    } catch (error: any) {
      throw new Error(`Failed to get photo by filename: ${error.message}`);
    }
  }

  /**
   * Get photos by post ID
   */
  static async getPhotosByPost(postId: string): Promise<any[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return [];
      }

      const photos = await Photo.find({ postId, status: 'active' })
        .sort({ position: 1, createdAt: -1 });

      // Convert each photo to include only id, position, and image (base64)
      const photosWithBase64 = await Promise.all(
        photos.map(async (photo) => {
          try {
            const filePath = photo.path;
            if (fs.existsSync(filePath)) {
              const fileBuffer = fs.readFileSync(filePath);
              const base64Data = fileBuffer.toString('base64');
              const base64String = `data:${photo.mimetype};base64,${base64Data}`;
              
              return {
                id: photo._id,
                position: photo.position || 0,
                postId: photo.postId,
                image: base64String
              };
            } else {
              // If file doesn't exist, return photo without image
              return {
                id: photo._id,
                position: photo.position || 0,
                postId: photo.postId,
                image: null
              };
            }
          } catch (error) {
            // If error reading file, return photo without image
            return {
              id: photo._id,
              position: photo.position || 0,
              postId: photo.postId,
              image: null
            };
          }
        })
      );

      return photosWithBase64;
    } catch (error: any) {
      throw new Error(`Failed to get photos by post: ${error.message}`);
    }
  }

  /**
   * Get photos by user ID
   */
  static async getPhotosByUser(userId: string): Promise<IPhoto[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return [];
      }

      return await Photo.find({ userId, status: 'active' })
        .sort({ createdAt: -1 });
    } catch (error: any) {
      throw new Error(`Failed to get photos by user: ${error.message}`);
    }
  }

  /**
   * Update photo
   */
  static async updatePhoto(id: string, updateData: Partial<IPhoto>): Promise<IPhoto | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      return await Photo.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      )
        .populate('postId', 'title slug')
        .populate('userId', 'firstName lastName email');
    } catch (error: any) {
      throw new Error(`Failed to update photo: ${error.message}`);
    }
  }

  /**
   * Delete photo (hard delete)
   */
  static async deletePhoto(id: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Photo.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  /**
   * Get photo statistics
   */
  static async getPhotoStats(): Promise<any> {
    try {
      const stats = await Photo.aggregate([
        {
          $group: {
            _id: null,
            totalPhotos: { $sum: 1 },
            totalSize: { $sum: '$size' },
            activePhotos: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            inactivePhotos: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
            },
            deletedPhotos: {
              $sum: { $cond: [{ $eq: ['$status', 'deleted'] }, 1, 0] }
            }
          }
        }
      ]);
      
      return stats[0] || {
        totalPhotos: 0,
        totalSize: 0,
        activePhotos: 0,
        inactivePhotos: 0,
        deletedPhotos: 0
      };
    } catch (error: any) {
      throw new Error(`Failed to get photo stats: ${error.message}`);
    }
  }
}
