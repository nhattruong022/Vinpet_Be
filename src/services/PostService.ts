import { Post, IPost } from '../models/Post';
import { User } from '../models/User';
import { PhotoService } from './PhotoService';
import mongoose from 'mongoose';

export class PostService {
  /**
   * Create a new post
   */
  static async createPost(postData: Partial<IPost>, authorId: string): Promise<IPost> {
    try {
      // Check if author exists
      const author = await User.findById(authorId);
      if (!author) {
        throw new Error('Author not found');
      }

      // Generate permalink if not provided
      if (!postData.permalink) {
        postData.permalink = this.generateSlug(postData.title || 'untitled');
      }

      // Set default SEO title if not provided
      if (!postData.seoTitle) {
        postData.seoTitle = postData.title || 'Untitled';
      }

      // Set default meta description if not provided
      if (!postData.metaDescription) {
        postData.metaDescription = postData.excerpt || '';
      }

      const post = new Post({
        ...postData,
        author: authorId,
        seoScore: this.calculateSeoScore(postData)
      });

      return await post.save();
    } catch (error: any) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  /**
   * Get post by ID
   */
  static async getPostById(id: string): Promise<IPost | null> {
    try {
      const post = await Post.findById(id)
        .populate('author', 'email firstName lastName')
        .populate('categories', 'name slug');
      
      if (!post) {
        return null;
      }

      // Get images from photos table
      const images = await PhotoService.getPhotosByPost((post._id as any).toString());
      
      return {
        ...post.toObject(),
        images: images
      } as any;
    } catch (error: any) {
      throw new Error(`Failed to get post: ${error.message}`);
    }
  }

  /**
   * Get all posts with pagination and filters
   */
  static async getPosts(options: {
    page?: number;
    limit?: number;
    status?: string;
    author?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    posts: IPost[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        author,
        category,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Build query
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (author) {
        query.author = author;
      }

      if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.categories = category;
        } else {
          const { Category } = await import('../models/Category');
          const categoryDoc = await Category.findOne({ slug: category });
          if (categoryDoc) {
            query.categories = categoryDoc._id;
          } else {
            // If category slug not found, force empty result
            query.categories = null;
          }
        }
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [posts, totalItems] = await Promise.all([
        Post.find(query)
          .populate('author', 'email firstName lastName')
          .populate('categories', 'name slug')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Post.countDocuments(query)
      ]);

      // Get images for each post from photos table
      const postsWithImages = await Promise.all(
        posts.map(async (post) => {
          const images = await PhotoService.getPhotosByPost((post._id as any).toString());
          return {
            ...post.toObject(),
            images: images
          };
        })
      );

      const totalPages = Math.ceil(totalItems / limit);

      return {
        posts: postsWithImages as any,
        totalItems,
        totalPages,
        currentPage: page
      };
    } catch (error: any) {
      throw new Error(`Failed to get posts: ${error.message}`);
    }
  }

  /**
   * Update post
   */
  static async updatePost(id: string, updateData: Partial<IPost>): Promise<IPost | null> {
    try {
      // Recalculate SEO score if content changed
      if (updateData.title || updateData.content || updateData.metaDescription) {
        const existingPost = await Post.findById(id);
        if (existingPost) {
          const mergedData = { ...existingPost.toObject(), ...updateData };
          updateData.seoScore = this.calculateSeoScore(mergedData);
        }
      }

      const updatedPost = await Post.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('author', 'email firstName lastName')
        .populate('categories', 'name slug');

      if (!updatedPost) {
        return null;
      }

      // Get images from photos table
      const images = await PhotoService.getPhotosByPost((updatedPost._id as any).toString());
      
      return {
        ...updatedPost.toObject(),
        images: images
      } as any;
    } catch (error: any) {
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  /**
   * Delete post
   */
  static async deletePost(id: string): Promise<boolean> {
    try {
      const result = await Post.findByIdAndDelete(id);
      return !!result;
    } catch (error: any) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Duplicate post
   */
  static async duplicatePost(id: string, newTitle?: string): Promise<IPost> {
    try {
      const originalPost = await Post.findById(id);
      if (!originalPost) {
        throw new Error('Post not found');
      }

      const duplicatedData = originalPost.toObject();
      delete (duplicatedData as any)._id;
      delete (duplicatedData as any).createdAt;
      delete (duplicatedData as any).updatedAt;

      duplicatedData.title = newTitle || `${originalPost.title} (Copy)`;
      duplicatedData.permalink = this.generateSlug(duplicatedData.title);
      duplicatedData.status = 'draft';
      delete (duplicatedData as any).publishDate;

      const duplicatedPost = new Post(duplicatedData);
      return await duplicatedPost.save();
    } catch (error: any) {
      throw new Error(`Failed to duplicate post: ${error.message}`);
    }
  }

  /**
   * Generate slug from title
   */
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Calculate SEO score
   */
  static calculateSeoScore(postData: Partial<IPost>): number {
    let score = 0;
    const maxScore = 100;

    // Title (20 points)
    if (postData.title && postData.title.length >= 10 && postData.title.length <= 60) {
      score += 20;
    } else if (postData.title) {
      score += 10;
    }

    // Meta Description (20 points)
    if (postData.metaDescription && postData.metaDescription.length >= 120 && postData.metaDescription.length <= 160) {
      score += 20;
    } else if (postData.metaDescription) {
      score += 10;
    }

    // Content (20 points)
    if (postData.content && postData.content.length >= 300) {
      score += 20;
    } else if (postData.content) {
      score += 10;
    }

    // Featured Image (10 points)
    if (postData.featuredImageUrl || postData.featuredImageId) {
      score += 10;
    }

    // Permalink (10 points)
    if (postData.permalink && postData.permalink.length <= 60) {
      score += 10;
    }

    // Categories/Tags (10 points)
    if (postData.categories && postData.categories.length > 0) {
      score += 5;
    }
    if (postData.tags && postData.tags.length > 0) {
      score += 5;
    }

    // Schema Data (10 points)
    if (postData.schemaData) {
      score += 10;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Get SEO snippet preview
   */
  static getSeoSnippetPreview(postData: {
    title: string;
    permalink: string;
    metaDescription: string;
    siteName?: string;
  }): {
    previewTitle: string;
    previewUrl: string;
    previewDescription: string;
  } {
    const siteName = postData.siteName || 'Vinpet';

    return {
      previewTitle: postData.title || 'Untitled',
      previewUrl: `https://${siteName.toLowerCase()}.com/${postData.permalink}`,
      previewDescription: postData.metaDescription || ''
    };
  }
}
