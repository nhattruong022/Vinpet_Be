import { Category, ICategory } from '../models/Category';
import mongoose from 'mongoose';

export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  parent?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryCreateData {
  name: string;
  description?: string;
  parent?: string;
  color?: string;
  icon?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface CategoryUpdateData {
  name?: string;
  description?: string;
  parent?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export class CategoryService {
  /**
   * Generate URL-friendly slug from name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Ensure slug is unique
   */
  private static async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const existingCategory = await Category.findOne({
        slug: uniqueSlug,
        ...(excludeId && { _id: { $ne: excludeId } })
      });

      if (!existingCategory) {
        break;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }

  /**
   * Get all categories with filters and pagination
   */
  static async getCategories(filters: CategoryFilters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      parent,
      isActive,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = filters;

    const query: any = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Parent filter
    if (parent !== undefined) {
      if (parent === null || parent === '') {
        query.parent = null;
      } else {
        query.parent = new mongoose.Types.ObjectId(parent);
      }
    }

    // Active filter
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .populate('children', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return {
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug')
      .lean();
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string): Promise<ICategory | null> {
    return await Category.findOne({ slug })
      .populate('parent', 'name slug')
      .populate('children', 'name slug')
      .lean();
  }

  /**
   * Create new category
   */
  static async createCategory(data: CategoryCreateData): Promise<ICategory> {
    const slug = await this.ensureUniqueSlug(this.generateSlug(data.name));

    const categoryData = {
      ...data,
      slug,
      parent: data.parent ? new mongoose.Types.ObjectId(data.parent) : null
    };

    const category = new Category(categoryData);
    await category.save();

    // Update parent's children array
    if (data.parent) {
      await Category.findByIdAndUpdate(
        data.parent,
        { $addToSet: { children: category._id } }
      );
    }

    const result = await this.getCategoryById((category._id as any).toString());
    if (!result) throw new Error('Failed to create category');
    return result;
  }

  /**
   * Update category
   */
  static async updateCategory(id: string, data: CategoryUpdateData): Promise<ICategory | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const updateData: any = { ...data };

    // Generate new slug if name changed
    if (data.name) {
      const slug = await this.ensureUniqueSlug(this.generateSlug(data.name), id);
      updateData.slug = slug;
    }

    // Handle parent change
    if (data.parent !== undefined) {
      const category = await Category.findById(id);
      if (category) {
        // Remove from old parent's children
        if (category.parent) {
          await Category.findByIdAndUpdate(
            category.parent,
            { $pull: { children: category._id } }
          );
        }

        // Add to new parent's children
        if (data.parent) {
          updateData.parent = new mongoose.Types.ObjectId(data.parent);
          await Category.findByIdAndUpdate(
            data.parent,
            { $addToSet: { children: category._id } }
          );
        } else {
          updateData.parent = null;
        }
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('parent', 'name slug')
      .populate('children', 'name slug')
      .lean();

    return updatedCategory;
  }

  /**
   * Delete category
   */
  static async deleteCategory(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const category = await Category.findById(id);
    if (!category) {
      return false;
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: category._id });
    if (childrenCount > 0) {
      throw new Error('Cannot delete category with children. Please delete children first.');
    }

    // Check if category has posts
    const { Post } = await import('../models/Post');
    const postsCount = await Post.countDocuments({ categories: category._id });
    if (postsCount > 0) {
      throw new Error('Cannot delete category with posts. Please reassign posts first.');
    }

    // Remove from parent's children array
    if (category.parent) {
      await Category.findByIdAndUpdate(
        category.parent,
        { $pull: { children: category._id } }
      );
    }

    await Category.findByIdAndDelete(id);
    return true;
  }

  /**
   * Get category tree (nested structure)
   */
  static async getCategoryTree(): Promise<any[]> {
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .populate('children', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Build tree structure
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // First pass: create map
    categories.forEach(category => {
      categoryMap.set(category._id.toString(), { ...category, children: [] });
    });

    // Second pass: build tree
    categories.forEach(category => {
      const categoryObj = categoryMap.get(category._id.toString());
      if (category.parent) {
        const parent = categoryMap.get(category.parent.toString());
        if (parent) {
          parent.children.push(categoryObj);
        }
      } else {
        rootCategories.push(categoryObj);
      }
    });

    return rootCategories;
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<any> {
    const totalCategories = await Category.countDocuments();
    const activeCategories = await Category.countDocuments({ isActive: true });
    const categoriesWithPosts = await Category.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'categories',
          as: 'posts'
        }
      },
      {
        $match: {
          'posts.0': { $exists: true }
        }
      },
      {
        $count: 'count'
      }
    ]);

    return {
      totalCategories,
      activeCategories,
      inactiveCategories: totalCategories - activeCategories,
      categoriesWithPosts: categoriesWithPosts[0]?.count || 0
    };
  }
}
