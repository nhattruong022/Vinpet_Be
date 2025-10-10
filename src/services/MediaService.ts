import { Media, IMedia } from '../models/Media';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

export interface MediaFilters {
  page?: number;
  limit?: number;
  search?: string;
  mimeType?: string;
  folder?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MediaUploadData {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  uploadedBy: string;
  folder?: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
  };
}

export class MediaService {
  /**
   * Generate unique filename
   */
  private static generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${baseName}-${timestamp}-${random}${ext}`;
  }

  /**
   * Get file type from MIME type
   */
  private static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  /**
   * Get all media files with filters and pagination
   */
  static async getMedia(filters: MediaFilters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      mimeType,
      folder,
      uploadedBy,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { alt: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } }
      ];
    }

    // MIME type filter
    if (mimeType) {
      if (mimeType.includes('/')) {
        query.mimeType = mimeType;
      } else {
        query.mimeType = { $regex: `^${mimeType}/` };
      }
    }

    // Folder filter
    if (folder) {
      query.folder = folder;
    }

    // Uploader filter
    if (uploadedBy) {
      query.uploadedBy = new mongoose.Types.ObjectId(uploadedBy);
    }

    // Public filter
    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    // Sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const media = await Media.find(query)
      .populate('uploadedBy', 'email displayName')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Media.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      media,
      pagination: {
        currentPage: page,
        totalPages,
        totalMedia: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get media by ID
   */
  static async getMediaById(id: string): Promise<IMedia | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return await Media.findById(id)
      .populate('uploadedBy', 'email displayName')
      .lean();
  }

  /**
   * Create new media record
   */
  static async createMedia(data: MediaUploadData): Promise<IMedia> {
    const mediaData = {
      ...data,
      uploadedBy: new mongoose.Types.ObjectId(data.uploadedBy)
    };

    const media = new Media(mediaData);
    await media.save();

    const result = await this.getMediaById((media._id as any).toString());
    if (!result) throw new Error('Failed to create media');
    return result;
  }

  /**
   * Update media
   */
  static async updateMedia(id: string, data: Partial<MediaUploadData>): Promise<IMedia | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateData: any = { ...data };

    // Convert uploadedBy to ObjectId if provided
    if (data.uploadedBy) {
      updateData.uploadedBy = new mongoose.Types.ObjectId(data.uploadedBy);
    }

    const updatedMedia = await Media.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('uploadedBy', 'email displayName')
      .lean();

    return updatedMedia;
  }

  /**
   * Delete media
   */
  static async deleteMedia(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const media = await Media.findById(id);
    if (!media) {
      return false;
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(media.url)) {
        fs.unlinkSync(media.url);
      }
      if (media.thumbnailUrl && fs.existsSync(media.thumbnailUrl)) {
        fs.unlinkSync(media.thumbnailUrl);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await Media.findByIdAndDelete(id);
    return true;
  }

  /**
   * Get media statistics
   */
  static async getMediaStats(): Promise<any> {
    const totalMedia = await Media.countDocuments();
    const publicMedia = await Media.countDocuments({ isPublic: true });
    const privateMedia = await Media.countDocuments({ isPublic: false });

    // Count by file type
    const mediaByType = await Media.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: '$mimeType', regex: /^image\// } },
              'image',
              {
                $cond: [
                  { $regexMatch: { input: '$mimeType', regex: /^video\// } },
                  'video',
                  {
                    $cond: [
                      { $regexMatch: { input: '$mimeType', regex: /^audio\// } },
                      'audio',
                      'document'
                    ]
                  }
                ]
              }
            ]
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    // Total size
    const totalSizeResult = await Media.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    const totalSize = totalSizeResult[0]?.totalSize || 0;

    return {
      totalMedia,
      publicMedia,
      privateMedia,
      mediaByType,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize)
    };
  }

  /**
   * Format file size in human readable format
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get media by folder
   */
  static async getMediaByFolder(folder: string): Promise<IMedia[]> {
    return await Media.find({ folder })
      .populate('uploadedBy', 'email displayName')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get recent media
   */
  static async getRecentMedia(limit: number = 10): Promise<IMedia[]> {
    return await Media.find()
      .populate('uploadedBy', 'email displayName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Search media
   */
  static async searchMedia(query: string, limit: number = 20): Promise<IMedia[]> {
    return await Media.find({
      $or: [
        { filename: { $regex: query, $options: 'i' } },
        { originalName: { $regex: query, $options: 'i' } },
        { alt: { $regex: query, $options: 'i' } },
        { caption: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .populate('uploadedBy', 'email displayName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get media usage (which posts use this media)
   */
  static async getMediaUsage(id: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return [];
    }

    const { Post } = await import('../models/Post');
    
    return await Post.find({
      $or: [
        { featuredImageId: id },
        { 'featuredImageUrl': { $regex: id } }
      ]
    })
      .select('title permalink status createdAt')
      .lean();
  }
}
