import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title_vi?: string;
  title_en?: string;
  title_ko?: string;
  content_vi?: string;
  content_en?: string;
  content_ko?: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'pending' | 'archived' | 'private';
  publishDate?: Date;
  lockModifiedDate: boolean;

  // SEO Fields
  seoTitle: string;
  permalink: string;
  metaDescription: string;
  featuredImageUrl?: string;
  featuredImageId?: string;
  seoScore: number;

  // Robots Meta
  robotsMeta: {
    index: boolean;
    nofollow: boolean;
    noimageindex: boolean;
    noarchive: boolean;
    nosnippet: boolean;
  };

  // Advanced Robot Meta
  advancedRobotMeta: {
    maxSnippet: number;
    maxVideoPreview: number;
    maxImagePreview: 'none' | 'standard' | 'large';
  };

  // Schema & Canonical
  canonicalUrl?: string;
  breadcrumbTitle?: string;
  redirectEnabled: boolean;

  // Author & Categories
  author: mongoose.Types.ObjectId;
  categories?: mongoose.Types.ObjectId[];
  tags?: string[];

  // Schema Data
  schemaData?: {
    type: string;
    data: any;
  };

  // Social Media
  socialMedia?: {
    facebook?: {
      title?: string;
      description?: string;
      image?: string;
    };
    twitter?: {
      title?: string;
      description?: string;
      image?: string;
    };
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>({
  title_vi: {
    type: String,
    trim: true
  },
  title_en: {
    type: String,
    trim: true
  },
  title_ko: {
    type: String,
    trim: true
  },
  content_vi: {
    type: String
  },
  content_en: {
    type: String
  },
  content_ko: {
    type: String
  },
  excerpt: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'pending', 'archived', 'private'],
    default: 'draft'
  },
  publishDate: {
    type: Date
  },
  lockModifiedDate: {
    type: Boolean,
    default: false
  },

  // SEO Fields
  seoTitle: {
    type: String,
    trim: true
  },
  permalink: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  featuredImageUrl: {
    type: String
  },
  featuredImageId: {
    type: String
  },
  seoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Robots Meta
  robotsMeta: {
    index: { type: Boolean, default: true },
    nofollow: { type: Boolean, default: false },
    noimageindex: { type: Boolean, default: false },
    noarchive: { type: Boolean, default: false },
    nosnippet: { type: Boolean, default: false }
  },

  // Advanced Robot Meta
  advancedRobotMeta: {
    maxSnippet: { type: Number, default: -1 },
    maxVideoPreview: { type: Number, default: -1 },
    maxImagePreview: {
      type: String,
      enum: ['none', 'standard', 'large'],
      default: 'large'
    }
  },

  // Schema & Canonical
  canonicalUrl: {
    type: String
  },
  breadcrumbTitle: {
    type: String,
    trim: true
  },
  redirectEnabled: {
    type: Boolean,
    default: false
  },

  // Author & Categories
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [{
    type: String,
    trim: true
  }],

  // Schema Data
  schemaData: {
    type: {
      type: String,
      default: 'BlogPosting'
    },
    data: Schema.Types.Mixed
  },

  // Social Media
  socialMedia: {
    facebook: {
      title: String,
      description: String,
      image: String
    },
    twitter: {
      title: String,
      description: String,
      image: String
    }
  }
}, {
  timestamps: true
});

// Indexes
PostSchema.index({ permalink: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ author: 1 });
PostSchema.index({ publishDate: -1 });
PostSchema.index({ createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);
