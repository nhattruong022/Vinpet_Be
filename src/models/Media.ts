import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  uploadedBy: mongoose.Types.ObjectId;
  folder?: string;
  tags?: string[];
  isPublic: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // for videos
    format?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required'],
    trim: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  url: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  alt: {
    type: String,
    trim: true,
    maxlength: [125, 'Alt text cannot exceed 125 characters']
  },
  caption: {
    type: String,
    trim: true,
    maxlength: [500, 'Caption cannot exceed 500 characters']
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  folder: {
    type: String,
    trim: true,
    default: 'uploads'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  metadata: {
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    format: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Indexes
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ folder: 1 });
mediaSchema.index({ isPublic: 1 });
mediaSchema.index({ createdAt: -1 });

// Virtual for file type
mediaSchema.virtual('fileType').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  return 'document';
});

// Virtual for file size in human readable format
mediaSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Ensure virtual fields are serialized
mediaSchema.set('toJSON', { virtuals: true });
mediaSchema.set('toObject', { virtuals: true });

export const Media = mongoose.model<IMedia>('Media', mediaSchema);
