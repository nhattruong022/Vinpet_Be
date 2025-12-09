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

      // Generate permalink if not provided - ưu tiên title_en, sau đó title_vi, cuối cùng title_ko
      if (!postData.permalink) {
        const titleForSlug = postData.title_en || postData.title_vi || postData.title_ko || 'untitled';
        postData.permalink = this.generateSlug(titleForSlug);
      }

      // Set default SEO title if not provided - ưu tiên title_en
      if (!postData.seoTitle) {
        postData.seoTitle = postData.title_en || postData.title_vi || postData.title_ko || 'Untitled';
      }

      // Set default meta description if not provided - ưu tiên description_en, sau đó description_vi, cuối cùng description_ko hoặc description cũ
      if (!postData.metaDescription) {
        postData.metaDescription = postData.description_en || postData.description_vi || postData.description_ko || postData.description || '';
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

      // Find thumbnail image (position = 0) and set featuredImageUrl/featuredImageId
      const postData = post.toObject();
      const thumbnailImage = images.find((img: any) => img.position === 0);

      if (thumbnailImage) {
        // Get photo details to get URL
        const thumbnailPhoto = await PhotoService.getPhotoById(thumbnailImage.id.toString());
        if (thumbnailPhoto) {
          postData.featuredImageUrl = thumbnailPhoto.url;
          postData.featuredImageId = thumbnailImage.id.toString();
        }
      }

      return {
        ...postData,
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
          { title_en: { $regex: search, $options: 'i' } },
          { title_vi: { $regex: search, $options: 'i' } },
          { title_ko: { $regex: search, $options: 'i' } },
          { content_en: { $regex: search, $options: 'i' } },
          { content_vi: { $regex: search, $options: 'i' } },
          { content_ko: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { description_en: { $regex: search, $options: 'i' } },
          { description_vi: { $regex: search, $options: 'i' } },
          { description_ko: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort: any = {};

      // If sorting by publishDate, also sort by createdAt as secondary sort
      if (sortBy === 'publishDate') {
        sort.publishDate = sortOrder === 'asc' ? 1 : -1;
        sort.createdAt = sortOrder === 'asc' ? 1 : -1; // Secondary sort
      } else {
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      }

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
          const postData = post.toObject();

          // Find thumbnail image (position = 0) and set featuredImageUrl/featuredImageId
          const thumbnailImage = images.find((img: any) => img.position === 0);

          if (thumbnailImage) {
            // Get photo details to get URL
            const thumbnailPhoto = await PhotoService.getPhotoById(thumbnailImage.id.toString());
            if (thumbnailPhoto) {
              postData.featuredImageUrl = thumbnailPhoto.url;
              postData.featuredImageId = thumbnailImage.id.toString();
            }
          }

          return {
            ...postData,
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
      const hasTitleChange = updateData.title_en || updateData.title_vi || updateData.title_ko;
      const hasContentChange = updateData.content_en || updateData.content_vi || updateData.content_ko;
      if (hasTitleChange || hasContentChange || updateData.metaDescription) {
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

      // Duplicate title - ưu tiên title_en, sau đó title_vi, cuối cùng title_ko
      const originalTitle = originalPost.title_en || originalPost.title_vi || originalPost.title_ko || 'Untitled';
      if (newTitle) {
        duplicatedData.title_en = newTitle;
      } else {
        duplicatedData.title_en = `${originalTitle} (Copy)`;
      }
      duplicatedData.permalink = this.generateSlug(duplicatedData.title_en);
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

    // Title (20 points) - ưu tiên title_en, sau đó title_vi, cuối cùng title_ko
    const title = postData.title_en || postData.title_vi || postData.title_ko;
    if (title && title.length >= 10 && title.length <= 60) {
      score += 20;
    } else if (title) {
      score += 10;
    }

    // Meta Description (20 points)
    if (postData.metaDescription && postData.metaDescription.length >= 120 && postData.metaDescription.length <= 160) {
      score += 20;
    } else if (postData.metaDescription) {
      score += 10;
    }

    // Content (20 points) - ưu tiên content_en, sau đó content_vi, cuối cùng content_ko
    const content = postData.content_en || postData.content_vi || postData.content_ko;
    if (content && content.length >= 300) {
      score += 20;
    } else if (content) {
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
    title_en?: string;
    title_vi?: string;
    title_ko?: string;
    permalink: string;
    metaDescription: string;
    siteName?: string;
  }): {
    previewTitle: string;
    previewUrl: string;
    previewDescription: string;
  } {
    const siteName = postData.siteName || 'Vinpet';
    // Ưu tiên title_en, sau đó title_vi, cuối cùng title_ko
    const title = postData.title_en || postData.title_vi || postData.title_ko || 'Untitled';

    return {
      previewTitle: title,
      previewUrl: `https://${siteName.toLowerCase()}.com/${postData.permalink}`,
      previewDescription: postData.metaDescription || ''
    };
  }
}
