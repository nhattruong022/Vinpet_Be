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
