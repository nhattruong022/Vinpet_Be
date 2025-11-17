import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import mongoose from 'mongoose';

export class CategoryController {
  /**
   * @swagger
   * /api/categories/tree:
   *   get:
   *     summary: Get category tree structure (full tree with all active categories and submenus)
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: Category tree retrieved successfully
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
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/CategoryTree'
   *       500:
   *         description: Internal server error
   */
  static async getCategoryTree(req: Request, res: Response): Promise<void> {
    try {
      // Luôn trả về full tree với active categories (bao gồm cả submenu)
      const tree = await CategoryService.getCategoryTree({
        rootOnly: false,
        includeInactive: false
      });

      // Nếu không có dữ liệu, trả về 204 No Content
      if (!tree || tree.length === 0) {
        res.status(204).send();
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category tree retrieved successfully',
        returnCode: 200,
        result: tree
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        returnCode: 500
      });
    }
  }

  /**
   * @swagger
   * /api/categories/{id}/posts:
   *   get:
   *     summary: Get all published posts by category ID (for menu click)
   *     description: When user clicks on a menu item (category), this API returns all published posts in that category
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID from menu
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
   *                 returnCode:
   *                   type: integer
   *                 result:
   *                   type: object
   *                   properties:
   *                     category:
   *                       type: object
   *                       properties:
   *                         _id:
   *                           type: string
   *                         name:
   *                           type: string
   *                         slug:
   *                           type: string
   *                         description:
   *                           type: string
   *                     posts:
   *                       type: array
   *                       items:
   *                         allOf:
   *                           - $ref: '#/components/schemas/Post'
   *                           - type: object
   *                             properties:
   *                               images:
   *                                 type: array
   *                                 items:
   *                                   type: object
   *                                   properties:
   *                                     id:
   *                                       type: string
   *                                     position:
   *                                       type: integer
   *                                     postId:
   *                                       type: string
   *                                     image:
   *                                       type: string
   *                                       description: Base64 encoded image
   *       204:
   *         description: No posts found in this category
   *       404:
   *         description: Category not found
   *       500:
   *         description: Internal server error
   */
  static async getCategoryPosts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          returnCode: 400
        });
        return;
      }

      // Check if category exists
      const category = await CategoryService.getCategoryById(id);
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found',
          returnCode: 404
        });
        return;
      }

      // Import PostService and PhotoService dynamically to avoid circular dependency
      const { PostService } = await import('../services/PostService');
      const { PhotoService } = await import('../services/PhotoService');

      // Get all published posts by category (no pagination)
      const postsData = await PostService.getPosts({
        category: id,
        status: 'published',
        page: 1,
        limit: 1000, // Get all posts
        sortBy: 'publishDate',
        sortOrder: 'desc'
      });

      // Return 204 if no posts
      if (!postsData.posts || postsData.posts.length === 0) {
        res.status(204).send();
        return;
      }

      // Add images to each post
      const postsWithImages = await Promise.all(
        postsData.posts.map(async (post: any) => {
          const images = await PhotoService.getPhotosByPost(post._id.toString());
          return {
            ...post,
            images: images
          };
        })
      );

      res.status(200).json({
        success: true,
        message: 'Posts retrieved successfully',
        returnCode: 200,
        result: {
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description
          },
          posts: postsWithImages
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
        returnCode: 500
      });
    }
  }

  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Create a new category (menu item)
   *     description: |
   *       Creates a new category with automatic generation of:
   *       - **name**: Set from menuName
   *       - **slug**: Auto-generated from menuName (URL-friendly, hyphen-separated)
   *       - **key**: Auto-generated from menuName (snake_case format for frontend use)
   *       - **name_vi, name_en, name_ko**: All set to menuName value
   *       
   *       Example: menuName "About Us" will generate:
   *       - name: "About Us"
   *       - slug: "about-us"
   *       - key: "about_us"
   *     tags: [Categories]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - menuName
   *             properties:
   *               menuName:
   *                 type: string
   *                 example: "About Us"
   *                 description: |
   *                   Category menu name (required).
   *                   This will be used to generate:
   *                   - name field
   *                   - slug (about-us)
   *                   - key (about_us) for frontend
   *                   - name_vi, name_en, name_ko (all set to this value)
   *               description:
   *                 type: string
   *                 example: "Introduction to our company"
   *                 description: Category description
   *               parent:
   *                 type: string
   *                 example: "6912d9282df5d3d5dd5a0d8d"
   *                 description: Parent category ID (for creating child category/submenu). Leave empty for root category.
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 default: active
   *                 example: "active"
   *                 description: Category status (will be converted to isActive internally)
   *               metaTitle:
   *                 type: string
   *                 description: SEO meta title
   *               metaDescription:
   *                 type: string
   *                 description: SEO meta description
   *               featuredImage:
   *                 type: string
   *                 description: Featured image URL
   *               color:
   *                 type: string
   *                 pattern: '^#[0-9A-Fa-f]{6}$'
   *                 example: "#FF5733"
   *                 description: Category color (hex format)
   *               icon:
   *                 type: string
   *                 example: "icon-about"
   *                 description: Category icon
   *               sortOrder:
   *                 type: integer
   *                 default: 0
   *                 example: 10
   *                 description: Sort order for category display (lower numbers appear first)
   *           examples:
   *             simple:
   *               summary: Simple category
   *               value:
   *                 menuName: "About Us"
   *                 status: "active"
   *             withParent:
   *               summary: Child category
   *               value:
   *                 menuName: "Company Overview"
   *                 description: "Overview of the company"
   *                 parent: "6912d9282df5d3d5dd5a0d8d"
   *                 status: "active"
   *                 sortOrder: 20
   *             full:
   *               summary: Full category with all fields
   *               value:
   *                 menuName: "Products"
   *                 description: "Our product catalog"
   *                 parent: "6912d9282df5d3d5dd5a0d8d"
   *                 status: "active"
   *                 sortOrder: 50
   *                 metaTitle: "Products - Our Catalog"
   *                 metaDescription: "Browse our complete product catalog"
   *                 color: "#FF5733"
   *                 icon: "icon-products"
   *     responses:
   *       201:
   *         description: Category created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Category created successfully"
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *             examples:
   *               success:
   *                 summary: Successful creation
   *                 value:
   *                   success: true
   *                   message: "Category created successfully"
   *                   data:
   *                     _id: "6912d9292df5d3d5dd5a0d92"
   *                     name: "About Us"
   *                     slug: "about-us"
   *                     key: "about_us"
   *                     name_vi: "About Us"
   *                     name_en: "About Us"
   *                     name_ko: "About Us"
   *                     description: "Introduction to our company"
   *                     isActive: true
   *                     sortOrder: 10
   *                     parent: null
   *                     children: []
   *                     createdAt: "2025-01-11T10:00:00.000Z"
   *                     updatedAt: "2025-01-11T10:00:00.000Z"
   *       400:
   *         description: Bad request (missing required fields)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "menuName is required"
   *       409:
   *         description: Category with this slug or key already exists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Category with this slug already exists"
   *       500:
   *         description: Internal server error
   */
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData = req.body;

      // Validate required fields - menuName is required, slug will be auto-generated if not provided
      if (!categoryData.menuName) {
        res.status(400).json({
          success: false,
          message: 'menuName is required'
        });
        return;
      }

      // Map menuName to name for service
      if (categoryData.menuName) {
        categoryData.name = categoryData.menuName;
        delete categoryData.menuName;
      }

      // Convert status to isActive if provided
      if (categoryData.status !== undefined) {
        categoryData.isActive = categoryData.status === 'active';
        delete categoryData.status;
      }

      const category = await CategoryService.createCategory(categoryData);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error: any) {
      if (error.message === 'Category with this slug already exists') {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  }

  /**
   * @swagger
   * /api/categories/{id}:
   *   put:
   *     summary: Update category
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               description:
   *                 type: string
   *               parent:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *               metaTitle:
   *                 type: string
   *               metaDescription:
   *                 type: string
   *               featuredImage:
   *                 type: string
   *               sortOrder:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Category updated successfully
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
   *                   $ref: '#/components/schemas/Category'
   *       404:
   *         description: Category not found
   *       409:
   *         description: Category with this slug already exists
   *       500:
   *         description: Internal server error
   */
  static async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }

      const category = await CategoryService.updateCategory(id, updateData);

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error: any) {
      if (error.message === 'Category with this slug already exists') {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  }

  /**
   * @swagger
   * /api/categories/{id}:
   *   delete:
   *     summary: Delete category
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID
   *       - in: query
   *         name: force
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Force delete even if category has posts or children
   *     responses:
   *       200:
   *         description: Category deleted successfully
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
   *         description: Category not found
   *       409:
   *         description: Cannot delete category with posts or children
   *       500:
   *         description: Internal server error
   */
  static async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }



      const deleted = await CategoryService.deleteCategory(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error: any) {
      if (error.message === 'Cannot delete category with posts or children') {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    }
  }
}
