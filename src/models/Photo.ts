import mongoose, { Document, Schema } from 'mongoose';

export interface IPhoto extends Document {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
  
  // Metadata
  alt?: string;
  caption?: string;
  position?: number;
  
  // Associations
  postId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  
  // Status
  status: 'active' | 'inactive' | 'deleted';
  
  // SEO
  altText?: string;
  title?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<IPhoto>({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  
  // Metadata
  alt: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  position: {
    type: Number,
    default: 0
  },
  
  // Associations
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  // SEO
  altText: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
PhotoSchema.index({ filename: 1 });
PhotoSchema.index({ postId: 1 });
PhotoSchema.index({ userId: 1 });
PhotoSchema.index({ status: 1 });
PhotoSchema.index({ createdAt: -1 });
PhotoSchema.index({ postId: 1, position: 1 });

// Virtual for file extension
PhotoSchema.virtual('extension').get(function() {
  return this.filename.split('.').pop();
});

// Virtual for file size in human readable format
PhotoSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});


// Pre-save middleware to generate alt text if not provided
PhotoSchema.pre('save', function(next) {
  if (!this.altText && this.originalName) {
    // Generate alt text from original filename
    this.altText = this.originalName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
  }
  next();
});

export const Photo = mongoose.model<IPhoto>('Photo', PhotoSchema);
