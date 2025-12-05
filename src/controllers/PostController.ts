import { Request, Response } from 'express';
import { PostService } from '../services/PostService';
import mongoose from 'mongoose';
import { markdownToHtml } from '../utils/markdown';

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
   *         description: Search in title, content, description
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
   *       - in: query
   *         name: locale
   *         required: false
   *         schema:
   *           type: string
   *           enum: [en, vi, ko]
   *           default: vi
   *         description: Locale for title and content (en, vi, ko). Default is 'vi'
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
   *                 returnCode:
   *                   type: integer
   *                   example: 200
   *                 message:
   *                   type: string
   *                 result:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Post ID
   *                     title:
   *                       type: string
   *                       description: Post title based on locale parameter
   *                     content:
   *                       type: string
   *                       description: Post content based on locale parameter (converted from Markdown to HTML)
   *                     description:
   *                       type: string
   *                       description: Post description based on locale parameter
   *                     tags:
   *                       type: array
   *                       items:
   *                         type: string
   *                       description: Post tags
   *                     author:
   *                       type: string
   *                       description: Post author, default is VINPET
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       description: Post creation date
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                       description: Post last updated date
   *       404:
   *         description: Post not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 returnCode:
   *                   type: integer
   *                   example: 404
   *                 message:
   *                   type: string
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 returnCode:
   *                   type: integer
   *                   example: 500
   *                 message:
   *                   type: string
   *                 detail:
   *                   type: string
   *                   nullable: true
   */
  static async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { locale = 'vi' } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({
          success: false,
          returnCode: 404,
          message: 'Post not found'
        });
        return;
      }

      // Validate locale
      const validLocales = ['en', 'vi', 'ko'];
      const selectedLocale = validLocales.includes(locale as string) ? (locale as string) : 'vi';

      const post = await PostService.getPostById(id);

      if (!post) {
        res.status(404).json({
          success: false,
          returnCode: 404,
          message: 'Post not found'
        });
        return;
      }

      // Lấy title, content và description theo locale
      const title = selectedLocale === 'vi'
        ? (post.title_vi || post.title_en || '')
        : selectedLocale === 'ko'
          ? (post.title_ko || post.title_en || '')
          : (post.title_en || '');

      // Lấy content markdown theo locale
      let contentMarkdown = selectedLocale === 'vi'
        ? (post.content_vi || post.content_en || '')
        : selectedLocale === 'ko'
          ? (post.content_ko || post.content_en || '')
          : (post.content_en || '');

      // Chèn images vào content markdown dưới dạng markdown image syntax
      // Loại bỏ thumbnail image (position = 0) vì nó chỉ dùng làm thumbnail, không chèn vào content
      const images = (post as any).images || [];
      if (images.length > 0) {
        // Sắp xếp images theo position và loại bỏ thumbnail (position = 0)
        const contentImages = [...images]
          .filter((img: any) => img.position !== 0 && img.position !== null && img.position !== undefined) // Loại bỏ thumbnail
          .sort((a: any, b: any) => (a.position || 999) - (b.position || 999));

        // Tạo map images theo position
        const imagesByPosition = new Map<number, string[]>();
        contentImages.forEach((img: any) => {
          if (img.image && img.image.trim() !== '') {
            const altText = (img.altText || img.alt || 'Image').trim();
            const imageData = img.image.trim();
            if (imageData && imageData.startsWith('data:')) {
              const position = img.position || 999;
              if (!imagesByPosition.has(position)) {
                imagesByPosition.set(position, []);
              }
              imagesByPosition.get(position)!.push(`![${altText}](${imageData})`);
            }
          }
        });

        // Chèn images vào giữa content dựa trên position
        if (imagesByPosition.size > 0) {
          // Chia content thành các đoạn (paragraphs) dựa trên dòng trống
          // Giữ nguyên heading và nội dung của nó cùng nhau
          const paragraphs = contentMarkdown.split(/\n\n+/).filter(p => p.trim());
          const result: string[] = [];

          // Nếu có nhiều images nhưng chưa được phân bổ hợp lý, tự động phân bổ
          const totalImages = contentImages.length;
          const totalParagraphs = paragraphs.length;

          // Tính toán vị trí hợp lý để phân bổ đều images
          const getOptimalPositions = (imageCount: number, paragraphCount: number): number[] => {
            if (imageCount === 0 || paragraphCount === 0) return [];

            // Phân bổ đều: chia content thành (imageCount + 1) phần
            const positions: number[] = [];
            const step = Math.max(1, Math.floor(paragraphCount / (imageCount + 1)));

            for (let i = 1; i <= imageCount; i++) {
              const pos = Math.min(i * step, paragraphCount);
              positions.push(pos);
            }

            return positions;
          };

          // Kiểm tra xem có images nào có position hợp lý không (1 <= position <= totalParagraphs)
          const hasValidPositions = Array.from(imagesByPosition.keys()).some(
            pos => pos >= 1 && pos <= totalParagraphs
          );

          // Nếu không có position hợp lý, tự động phân bổ
          if (!hasValidPositions && totalImages > 0 && totalParagraphs > 0) {
            const optimalPositions = getOptimalPositions(totalImages, totalParagraphs);
            const imageArray = Array.from(imagesByPosition.values()).flat();

            // Xóa map cũ và tạo lại với position hợp lý
            imagesByPosition.clear();
            optimalPositions.forEach((pos, index) => {
              if (index < imageArray.length && imageArray[index]) {
                if (!imagesByPosition.has(pos)) {
                  imagesByPosition.set(pos, []);
                }
                imagesByPosition.get(pos)!.push(imageArray[index]);
              }
            });
          }

          // Duyệt qua từng đoạn và chèn images sau đoạn tương ứng
          paragraphs.forEach((paragraph, index) => {
            // Thêm đoạn vào kết quả
            result.push(paragraph.trim());

            // Position bắt đầu từ 1 (sau đoạn đầu tiên = position 1)
            const position = index + 1;

            // Nếu có images ở position này, chèn vào
            if (imagesByPosition.has(position)) {
              const imageMarkdowns = imagesByPosition.get(position)!;
              result.push(...imageMarkdowns);
            }
          });

          // Chèn các images có position > số đoạn vào cuối
          const maxPosition = paragraphs.length;
          imagesByPosition.forEach((imageMarkdowns, position) => {
            if (position > maxPosition) {
              result.push(...imageMarkdowns);
            }
          });

          // Ghép lại thành content hoàn chỉnh
          contentMarkdown = result.filter(p => p).join('\n\n');
        }
      }


      const content = contentMarkdown;

      let description = selectedLocale === 'vi'
        ? (post.description_vi || post.description_en || '')
        : selectedLocale === 'ko'
          ? (post.description_ko || post.description_en || '')
          : (post.description_en || '');

      // Làm sạch description: loại bỏ \r\n, \n, \r và khoảng trắng thừa, chỉ giữ text thuần túy
      description = description
        .replace(/\r\n/g, ' ')  // Thay \r\n bằng khoảng trắng
        .replace(/\n/g, ' ')    // Thay \n bằng khoảng trắng
        .replace(/\r/g, ' ')    // Thay \r bằng khoảng trắng
        .replace(/\s+/g, ' ')   // Thay nhiều khoảng trắng liên tiếp bằng một khoảng trắng
        .trim();                // Loại bỏ khoảng trắng đầu và cuối

      // Trả về 8 field: id, title, content (HTML), description, tags, author, createdAt, updatedAt (theo locale)
      res.status(200).json({
        success: true,
        returnCode: 200,
        message: 'Post retrieved successfully',
        result: {
          id: (post as any)._id.toString(),
          title: title,
          content: content,
          description: description,
          tags: post.tags || [],
          author: 'VINPET',
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message,
        detail: error.stack
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
   *             properties:
   *               title_en:
   *                 type: string
   *                 description: Post title in English
   *               title_vi:
   *                 type: string
   *                 description: Post title in Vietnamese
   *               title_ko:
   *                 type: string
   *                 description: Post title in Korean
   *               content_en:
   *                 type: string
   *                 description: Post content in English (Markdown format)
   *               content_vi:
   *                 type: string
   *                 description: Post content in Vietnamese (Markdown format)
   *               content_ko:
   *                 type: string
   *                 description: Post content in Korean (Markdown format)
   *               author:
   *                 type: string
   *                 description: Author ID (optional, defaults to first user in database if not provided)
   *               description:
   *                 type: string
   *                 description: Post description (deprecated, use description_en, description_vi, description_ko)
   *               description_en:
   *                 type: string
   *                 description: Post description in English
   *               description_vi:
   *                 type: string
   *                 description: Post description in Vietnamese
   *               description_ko:
   *                 type: string
   *                 description: Post description in Korean
   *               status:
   *                 type: string
   *                 enum: [draft, published, pending, archived, private]
   *                 default: draft
   *               publishDate:
   *                 type: string
   *                 format: date-time
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

      // Validate required fields - yêu cầu ít nhất một title và một content
      const hasTitle = postData.title_en || postData.title_vi || postData.title_ko;
      const hasContent = postData.content_en || postData.content_vi || postData.content_ko;

      if (!hasTitle || !hasContent) {
        res.status(400).json({
          success: false,
          returnCode: 400,
          message: 'At least one title (title_en, title_vi, or title_ko) and one content (content_en, content_vi, or content_ko) are required'
        });
        return;
      }

      // Set default author if not provided
      let authorId = postData.author;
      if (!authorId) {
        // Tìm user đầu tiên trong database làm author mặc định
        const { User } = await import('../models/User');
        const defaultUser = await User.findOne();
        if (!defaultUser) {
          res.status(400).json({
            success: false,
            returnCode: 400,
            message: 'No default author found. Please provide an author ID or create a user first.'
          });
          return;
        }
        authorId = (defaultUser as any)._id.toString();
      }

      const post = await PostService.createPost(postData, authorId);

      res.status(201).json({
        success: true,
        returnCode: 201,
        message: 'Post created successfully',
        result: post
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message,
        detail: error.stack
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
   *               description:
   *                 type: string
   *                 description: Post description (deprecated, use description_en, description_vi, description_ko)
   *               description_en:
   *                 type: string
   *                 description: Post description in English
   *               description_vi:
   *                 type: string
   *                 description: Post description in Vietnamese
   *               description_ko:
   *                 type: string
   *                 description: Post description in Korean
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
        title_en: title,
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

  /**
   * @swagger
   * /api/blog:
   *   get:
   *     summary: Get blog posts list with thumbnail and description
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
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Number of posts per page
   *     responses:
   *       200:
   *         description: Blog posts retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 returnCode:
   *                   type: integer
   *                 message:
   *                   type: string
   *                 result:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         description: Post ID
   *                       title_en:
   *                         type: string
   *                         description: Title in English
   *                       title_vi:
   *                         type: string
   *                         description: Title in Vietnamese
   *                       title_ko:
   *                         type: string
   *                         description: Title in Korean
   *                       description_en:
   *                         type: string
   *                         description: Description in English
   *                       description_vi:
   *                         type: string
   *                         description: Description in Vietnamese
   *                       description_ko:
   *                         type: string
   *                         description: Description in Korean
   *                       thumbnailImage:
   *                         type: string
   *                         nullable: true
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     currentPage:
   *                       type: integer
   *                     pageSize:
   *                       type: integer
   *                     totalItems:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       500:
   *         description: Internal server error
   */
  /**
   * @swagger
   * /api/blog/detail/{id}:
   *   get:
   *     summary: Get blog post detail by ID
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Post ID
   *       - in: query
   *         name: locale
   *         schema:
   *           type: string
   *           enum: [vi, en, ko]
   *           default: vi
   *         description: Locale for title and description
   *     responses:
   *       200:
   *         description: Blog post detail retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 returnCode:
   *                   type: integer
   *                 message:
   *                   type: string
   *                 result:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     title:
   *                       type: string
   *                     description:
   *                       type: string
   *                     author:
   *                       type: string
   *                     tags:
   *                       type: array
   *                       items:
   *                         type: string
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Post not found
   *       500:
   *         description: Internal server error
   */
  static async getBlogDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { locale = 'vi' } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(404).json({
          success: false,
          returnCode: 404,
          message: 'Post not found'
        });
        return;
      }

      // Validate locale
      const validLocales = ['en', 'vi', 'ko'];
      const selectedLocale = validLocales.includes(locale as string) ? (locale as string) : 'vi';

      const post = await PostService.getPostById(id);

      if (!post) {
        res.status(404).json({
          success: false,
          returnCode: 404,
          message: 'Post not found'
        });
        return;
      }

      // Lấy title theo locale
      const title = selectedLocale === 'vi'
        ? (post.title_vi || post.title_en || 'Blog')
        : selectedLocale === 'ko'
          ? (post.title_ko || post.title_en || 'Blog')
          : (post.title_en || 'Blog');

      // Lấy description theo locale
      let description = selectedLocale === 'vi'
        ? (post.description_vi || post.description_en || '')
        : selectedLocale === 'ko'
          ? (post.description_ko || post.description_en || '')
          : (post.description_en || '');

      // Làm sạch description: loại bỏ \r\n, \n, \r và khoảng trắng thừa
      description = description
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Trả về các field theo yêu cầu
      res.status(200).json({
        success: true,
        returnCode: 200,
        message: 'Blog detail retrieved successfully',
        result: {
          id: (post as any)._id.toString(),
          title: title || 'Blog',
          description: description,
          author: 'VINPET',
          tags: post.tags || [],
          updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message,
        detail: error.stack
      });
    }
  }

  static async getBlogPosts(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        pageSize = 10
      } = req.query;

      // Get published posts only, sorted by newest date first (publishDate preferred, then createdAt)
      const result = await PostService.getPosts({
        page: parseInt(page as string),
        limit: parseInt(pageSize as string),
        status: 'published',
        sortBy: 'publishDate', // Sort by publishDate first (newest first), fallback to createdAt
        sortOrder: 'desc'
      });

      // Transform posts to blog format
      const blogPosts = await Promise.all(
        result.posts.map(async (post: any) => {
          // Get thumbnail image (position = 0)
          let thumbnailImage: string | null = null;
          if (post.images && post.images.length > 0) {
            const thumbnail = post.images.find((img: any) => img.position === 0);
            if (thumbnail) {
              if (thumbnail.image) {
                thumbnailImage = thumbnail.image;
              } else {
                // Log when thumbnail exists but image is null
                console.warn(`Thumbnail image is null for post ${post._id}, photo ID: ${thumbnail.id}`);
              }
            } else {
              // Log when no thumbnail found
              console.warn(`No thumbnail (position=0) found for post ${post._id}, total images: ${post.images.length}`);
            }
          } else {
            // Log when no images at all
            console.warn(`No images found for post ${post._id}`);
          }

          // Build response object with multilingual fields
          // Description chỉ lấy từ description đúng ngôn ngữ, không fallback về description cũ
          const responseItem: any = {
            id: post._id.toString(),
            title_en: post.title_en || '',
            title_vi: post.title_vi || '',
            title_ko: post.title_ko || '',
            description_en: post.description_en || '',
            description_vi: post.description_vi || '',
            description_ko: post.description_ko || '',
            createdAt: post.createdAt
          };

          // Only add thumbnailImage field if it has a value (not null)
          if (thumbnailImage !== null) {
            responseItem.thumbnailImage = thumbnailImage;
          }

          return responseItem;
        })
      );

      // Format response according to ApiSuccessResponse with pagination
      res.status(200).json({
        success: true,
        returnCode: 200,
        message: 'Blog posts retrieved successfully',
        result: blogPosts,
        pagination: {
          currentPage: result.currentPage,
          pageSize: parseInt(pageSize as string) || 10,
          totalItems: result.totalItems,
          totalPages: result.totalPages
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        returnCode: 500,
        message: error.message,
        detail: error.stack
      });
    }
  }
}
