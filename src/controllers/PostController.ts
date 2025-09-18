import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import mongoose from 'mongoose';

export class PostController {
  /**
   * @swagger
   * /api/posts:
   *   get:
   *     summary: Get all posts with pagination and filters
   *     tags: [Posts]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of posts per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, pending, archived, private]
   *         description: Filter by post status
   *       - in: query
   *         name: author
   *         schema:
   *           type: string
   *         description: Filter by author ID
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by category ID
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in title, content, excerpt
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, updatedAt, publishDate, title, seoScore]
   *           default: createdAt
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Posts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     posts:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Post'
   *                     totalItems:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   *       500:
   *         description: Internal server error
   */
  static async getPosts(req: Request, res: Response): Promise<void> {
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
      } = req.query;

      const result = await PostService.getPosts({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        author: author as string,
        category: category as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      res.status(200).json({
        success: true,
        message: 'Posts retrieved successfully',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}:
   *   get:
   *     summary: Get post by ID
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID
   *     responses:
   *       200:
   *         description: Post retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Post'
   *       404:
   *         description: Post not found
   *       500:
   *         description: Internal server error
   */
  static async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID'
        });
        return;
      }

      const post = await PostService.getPostById(id);

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Post retrieved successfully',
        data: post
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/posts:
   *   post:
   *     summary: Create a new post
   *     tags: [Posts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - content
   *               - author
   *             properties:
   *               title:
   *                 type: string
   *                 description: Post title
   *               content:
   *                 type: string
   *                 description: Post content
   *               excerpt:
   *                 type: string
   *                 description: Post excerpt
   *               status:
   *                 type: string
   *                 enum: [draft, published, pending, archived, private]
   *                 default: draft
   *               publishDate:
   *                 type: string
   *                 format: date-time
   *               author:
   *                 type: string
   *                 description: Author ID
   *               seoTitle:
   *                 type: string
   *                 description: SEO title
   *               permalink:
   *                 type: string
   *                 description: URL slug
   *               metaDescription:
   *                 type: string
   *                 description: Meta description
   *               featuredImageUrl:
   *                 type: string
   *                 description: Featured image URL
   *               categories:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Category IDs
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Post tags
   *               robotsMeta:
   *                 type: object
   *                 properties:
   *                   index:
   *                     type: boolean
   *                   nofollow:
   *                     type: boolean
   *                   noimageindex:
   *                     type: boolean
   *                   noarchive:
   *                     type: boolean
   *                   nosnippet:
   *                     type: boolean
   *               canonicalUrl:
   *                 type: string
   *               breadcrumbTitle:
   *                 type: string
   *     responses:
   *       201:
   *         description: Post created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Post'
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  static async createPost(req: Request, res: Response): Promise<void> {
    try {
      const postData = req.body;

      // Validate required fields
      if (!postData.title || !postData.content || !postData.author) {
        res.status(400).json({
          success: false,
          message: 'Title, content, and author are required'
        });
        return;
      }

      const post = await PostService.createPost(postData, postData.author);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}:
   *   put:
   *     summary: Update post
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *               excerpt:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [draft, published, pending, archived, private]
   *               publishDate:
   *                 type: string
   *                 format: date-time
   *               lockModifiedDate:
   *                 type: boolean
   *               seoTitle:
   *                 type: string
   *               permalink:
   *                 type: string
   *               metaDescription:
   *                 type: string
   *               featuredImageUrl:
   *                 type: string
   *               featuredImageId:
   *                 type: string
   *               categories:
   *                 type: array
   *                 items:
   *                   type: string
   *               tags:
   *                 type: array
   *                 items:
   *                   type: string
   *               robotsMeta:
   *                 type: object
   *                 properties:
   *                   index:
   *                     type: boolean
   *                   nofollow:
   *                     type: boolean
   *                   noimageindex:
   *                     type: boolean
   *                   noarchive:
   *                     type: boolean
   *                   nosnippet:
   *                     type: boolean
   *               advancedRobotMeta:
   *                 type: object
   *                 properties:
   *                   maxSnippet:
   *                     type: number
   *                   maxVideoPreview:
   *                     type: number
   *                   maxImagePreview:
   *                     type: string
   *                     enum: [none, standard, large]
   *               canonicalUrl:
   *                 type: string
   *               breadcrumbTitle:
   *                 type: string
   *               redirectEnabled:
   *                 type: boolean
   *               schemaData:
   *                 type: object
   *                 properties:
   *                   type:
   *                     type: string
   *                   data:
   *                     type: object
   *     responses:
   *       200:
   *         description: Post updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Post'
   *       404:
   *         description: Post not found
   *       500:
   *         description: Internal server error
   */
  static async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID'
        });
        return;
      }

      const post = await PostService.updatePost(id, updateData);

      if (!post) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}:
   *   delete:
   *     summary: Delete post
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID
   *     responses:
   *       200:
   *         description: Post deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       404:
   *         description: Post not found
   *       500:
   *         description: Internal server error
   */
  static async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID'
        });
        return;
      }

      const deleted = await PostService.deletePost(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Post not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/posts/{id}/duplicate:
   *   post:
   *     summary: Duplicate post
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID to duplicate
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               newTitle:
   *                 type: string
   *                 description: New title for duplicated post
   *     responses:
   *       201:
   *         description: Post duplicated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Post'
   *       404:
   *         description: Post not found
   *       500:
   *         description: Internal server error
   */
  static async duplicatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { newTitle } = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid post ID'
        });
        return;
      }

      const duplicatedPost = await PostService.duplicatePost(id, newTitle);

      res.status(201).json({
        success: true,
        message: 'Post duplicated successfully',
        data: duplicatedPost
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/posts/seo-preview:
   *   post:
   *     summary: Get SEO snippet preview
   *     tags: [Posts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - permalink
   *               - metaDescription
   *             properties:
   *               title:
   *                 type: string
   *               permalink:
   *                 type: string
   *               metaDescription:
   *                 type: string
   *               siteName:
   *                 type: string
   *                 default: Vinpet
   *     responses:
   *       200:
   *         description: SEO preview generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     previewTitle:
   *                       type: string
   *                     previewUrl:
   *                       type: string
   *                     previewDescription:
   *                       type: string
   *       400:
   *         description: Bad request
   *       500:
   *         description: Internal server error
   */
  static async getSeoPreview(req: Request, res: Response): Promise<void> {
    try {
      const { title, permalink, metaDescription, siteName } = req.body;

      if (!title || !permalink || !metaDescription) {
        res.status(400).json({
          success: false,
          message: 'Title, permalink, and metaDescription are required'
        });
        return;
      }

      const preview = PostService.getSeoSnippetPreview({
        title,
        permalink,
        metaDescription,
        siteName
      });

      res.status(200).json({
        success: true,
        message: 'SEO preview generated successfully',
        data: preview
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
