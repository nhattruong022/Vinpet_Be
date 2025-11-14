import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import mongoose from 'mongoose';

export class CategoryController {
  /**
   * @swagger
   * /api/categories:
   *   get:
   *     summary: Get all categories
   *     tags: [Categories]
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
   *         description: Number of categories per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in category name and description
   *       - in: query
   *         name: parent
   *         schema:
   *           type: string
   *         description: Filter by parent category ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive]
   *         description: Filter by category status
   *     responses:
   *       200:
   *         description: Categories retrieved successfully
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
   *                     categories:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/Category'
   *                     totalItems:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *                     currentPage:
   *                       type: integer
   *       500:
   *         description: Internal server error
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        parent,
        status
      } = req.query;

      const filters: any = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        parent: parent as string
      };
      
      if (status === 'active') filters.isActive = true;
      if (status === 'inactive') filters.isActive = false;
      
      const result = await CategoryService.getCategories(filters);

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
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

      res.status(200).json({
        success: true,
        message: 'Category tree retrieved successfully',
        data: tree
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
   * /api/categories/stats:
   *   get:
   *     summary: Get category statistics
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: Category statistics retrieved successfully
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
   *                     totalCategories:
   *                       type: integer
   *                     activeCategories:
   *                       type: integer
   *                     inactiveCategories:
   *                       type: integer
   *                     rootCategories:
   *                       type: integer
   *                     categoriesWithPosts:
   *                       type: integer
   *                     averagePostsPerCategory:
   *                       type: number
   *       500:
   *         description: Internal server error
   */
  static async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await CategoryService.getCategoryStats();

      res.status(200).json({
        success: true,
        message: 'Category statistics retrieved successfully',
        data: stats
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
   * /api/categories/slug/{slug}:
   *   get:
   *     summary: Get category by slug
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: slug
   *         required: true
   *         schema:
   *           type: string
   *         description: Category slug
   *       - in: query
   *         name: includePosts
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include posts in response
   *       - in: query
   *         name: postsLimit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of posts to include
   *     responses:
   *       200:
   *         description: Category retrieved successfully
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
   *       500:
   *         description: Internal server error
   */
  static async getCategoryBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const { includePosts = false, postsLimit = 10 } = req.query;

      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Slug is required'
        });
        return;
      }

      const category = await CategoryService.getCategoryBySlug(slug);

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
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
   * /api/categories/{id}:
   *   get:
   *     summary: Get category by ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Category ID
   *       - in: query
   *         name: includePosts
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include posts in response
   *       - in: query
   *         name: includeChildren
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include child categories
   *     responses:
   *       200:
   *         description: Category retrieved successfully
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
   *       500:
   *         description: Internal server error
   */
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includePosts = false, includeChildren = false } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
        return;
      }

      const category = await CategoryService.getCategoryById(id);

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
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
   * /api/categories:
   *   post:
   *     summary: Create a new category
   *     tags: [Categories]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - slug
   *             properties:
   *               name:
   *                 type: string
   *                 description: Category name
   *               slug:
   *                 type: string
   *                 description: Category slug (URL-friendly)
   *               description:
   *                 type: string
   *                 description: Category description
   *               parent:
   *                 type: string
   *                 description: Parent category ID
   *               status:
   *                 type: string
   *                 enum: [active, inactive]
   *                 default: active
   *                 description: Category status
   *               metaTitle:
   *                 type: string
   *                 description: SEO meta title
   *               metaDescription:
   *                 type: string
   *                 description: SEO meta description
   *               featuredImage:
   *                 type: string
   *                 description: Featured image URL
   *               sortOrder:
   *                 type: integer
   *                 default: 0
   *                 description: Sort order
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
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Category'
   *       400:
   *         description: Bad request
   *       409:
   *         description: Category with this slug already exists
   *       500:
   *         description: Internal server error
   */
  static async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData = req.body;

      // Validate required fields
      if (!categoryData.name || !categoryData.slug) {
        res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
        return;
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
