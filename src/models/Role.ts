import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  isDefault: boolean;
  level: number; // Higher number = more permissions
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true,
    maxlength: [50, 'Role name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Role slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  permissions: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  level: {
    type: Number,
    required: [true, 'Role level is required'],
    min: [0, 'Role level cannot be negative'],
    max: [100, 'Role level cannot exceed 100']
  }
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ slug: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ level: -1 });

// Predefined permissions
export const PERMISSIONS = {
  // Post permissions
  POST_CREATE: 'post:create',
  POST_READ: 'post:read',
  POST_UPDATE: 'post:update',
  POST_DELETE: 'post:delete',
  POST_PUBLISH: 'post:publish',
  
  // Category permissions
  CATEGORY_CREATE: 'category:create',
  CATEGORY_READ: 'category:read',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',
  
  // Media permissions
  MEDIA_UPLOAD: 'media:upload',
  MEDIA_READ: 'media:read',
  MEDIA_UPDATE: 'media:update',
  MEDIA_DELETE: 'media:delete',
  
  // Comment permissions
  COMMENT_READ: 'comment:read',
  COMMENT_APPROVE: 'comment:approve',
  COMMENT_DELETE: 'comment:delete',
  
  // User permissions
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Role permissions
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  
  // System permissions
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_LOGS: 'system:logs'
};

// Predefined roles
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Full system access',
    permissions: Object.values(PERMISSIONS),
    level: 100
  },
  ADMIN: {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrative access',
    permissions: [
      PERMISSIONS.POST_CREATE,
      PERMISSIONS.POST_READ,
      PERMISSIONS.POST_UPDATE,
      PERMISSIONS.POST_DELETE,
      PERMISSIONS.POST_PUBLISH,
      PERMISSIONS.CATEGORY_CREATE,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.CATEGORY_UPDATE,
      PERMISSIONS.CATEGORY_DELETE,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.MEDIA_UPDATE,
      PERMISSIONS.MEDIA_DELETE,
      PERMISSIONS.COMMENT_READ,
      PERMISSIONS.COMMENT_APPROVE,
      PERMISSIONS.COMMENT_DELETE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE
    ],
    level: 80
  },
  EDITOR: {
    name: 'Editor',
    slug: 'editor',
    description: 'Content editing access',
    permissions: [
      PERMISSIONS.POST_CREATE,
      PERMISSIONS.POST_READ,
      PERMISSIONS.POST_UPDATE,
      PERMISSIONS.POST_PUBLISH,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.COMMENT_READ,
      PERMISSIONS.COMMENT_APPROVE
    ],
    level: 60
  },
  AUTHOR: {
    name: 'Author',
    slug: 'author',
    description: 'Content creation access',
    permissions: [
      PERMISSIONS.POST_CREATE,
      PERMISSIONS.POST_READ,
      PERMISSIONS.POST_UPDATE,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.MEDIA_UPLOAD,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.COMMENT_READ
    ],
    level: 40
  },
  SUBSCRIBER: {
    name: 'Subscriber',
    slug: 'subscriber',
    description: 'Basic access',
    permissions: [
      PERMISSIONS.POST_READ,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.MEDIA_READ,
      PERMISSIONS.COMMENT_READ
    ],
    level: 20
  }
};

export const Role = mongoose.model<IRole>('Role', roleSchema);
