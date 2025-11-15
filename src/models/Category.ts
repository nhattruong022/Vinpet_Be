import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  key: string;
  description?: string;
  name_en?: string;
  name_vi?: string;
  name_ko?: string;
  description_en?: string;
  description_vi?: string;
  description_ko?: string;
  parent?: mongoose.Types.ObjectId;
  children?: mongoose.Types.ObjectId[];
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  key: {
    type: String,
    required: [true, 'Category key is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9_]+$/, 'Key can only contain lowercase letters, numbers, and underscores']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  name_en: {
    type: String,
    trim: true,
    maxlength: [100, 'English name cannot exceed 100 characters']
  },
  name_vi: {
    type: String,
    trim: true,
    maxlength: [100, 'Vietnamese name cannot exceed 100 characters']
  },
  name_ko: {
    type: String,
    trim: true,
    maxlength: [100, 'Korean name cannot exceed 100 characters']
  },
  description_en: {
    type: String,
    trim: true,
    maxlength: [500, 'English description cannot exceed 500 characters']
  },
  description_vi: {
    type: String,
    trim: true,
    maxlength: [500, 'Vietnamese description cannot exceed 500 characters']
  },
  description_ko: {
    type: String,
    trim: true,
    maxlength: [500, 'Korean description cannot exceed 500 characters']
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }],
  color: {
    type: String,
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  icon: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ key: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

// Virtual for post count
categorySchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'categories',
  count: true
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
