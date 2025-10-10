import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: {
    name: string;
    email: string;
    website?: string;
  };
  post: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  replies?: mongoose.Types.ObjectId[];
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  isAnonymous: boolean;
  userAgent?: string;
  ipAddress?: string;
  likes: number;
  dislikes: number;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Author email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Website must be a valid URL']
    }
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required']
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'spam'],
    default: 'pending'
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  likes: {
    type: Number,
    default: 0,
    min: [0, 'Likes cannot be negative']
  },
  dislikes: {
    type: Number,
    default: 0,
    min: [0, 'Dislikes cannot be negative']
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ post: 1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ 'author.email': 1 });

// Virtual for reply count
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent',
  count: true
});

// Virtual for total engagement
commentSchema.virtual('totalEngagement').get(function() {
  return this.likes + this.dislikes;
});

// Ensure virtual fields are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
