import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vinpet API',
      version: '1.0.0',
      description: 'API documentation for Vinpet Backend',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Post ID'
            },
            title: {
              type: 'string',
              description: 'Post title'
            },
            content: {
              type: 'string',
              description: 'Post content'
            },
            excerpt: {
              type: 'string',
              description: 'Post excerpt'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'pending', 'archived', 'private'],
              description: 'Post status'
            },
            publishDate: {
              type: 'string',
              format: 'date-time',
              description: 'Publish date'
            },
            lockModifiedDate: {
              type: 'boolean',
              description: 'Lock modified date'
            },
            seoTitle: {
              type: 'string',
              description: 'SEO title'
            },
            permalink: {
              type: 'string',
              description: 'URL slug'
            },
            metaDescription: {
              type: 'string',
              description: 'Meta description'
            },
            featuredImageUrl: {
              type: 'string',
              description: 'Featured image URL'
            },
            featuredImageId: {
              type: 'string',
              description: 'Featured image ID'
            },
            seoScore: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'SEO score'
            },
            robotsMeta: {
              type: 'object',
              properties: {
                index: { type: 'boolean' },
                nofollow: { type: 'boolean' },
                noimageindex: { type: 'boolean' },
                noarchive: { type: 'boolean' },
                nosnippet: { type: 'boolean' }
              }
            },
            advancedRobotMeta: {
              type: 'object',
              properties: {
                maxSnippet: { type: 'number' },
                maxVideoPreview: { type: 'number' },
                maxImagePreview: {
                  type: 'string',
                  enum: ['none', 'standard', 'large']
                }
              }
            },
            canonicalUrl: {
              type: 'string',
              description: 'Canonical URL'
            },
            breadcrumbTitle: {
              type: 'string',
              description: 'Breadcrumb title'
            },
            redirectEnabled: {
              type: 'boolean',
              description: 'Redirect enabled'
            },
            author: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' }
              }
            },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  slug: { type: 'string' }
                }
              }
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            },
            schemaData: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                data: { type: 'object' }
              }
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Photo ID'
                  },
                  position: {
                    type: 'integer',
                    description: 'Position of image in post'
                  },
                  postId: {
                    type: 'string',
                    description: 'Post ID that this image belongs to'
                  },
                  image: {
                    type: 'string',
                    description: 'Base64 encoded image data'
                  }
                }
              },
              description: 'Array of images associated with the post'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            name_en: {
              type: 'string',
              description: 'Category name in English'
            },
            name_vi: {
              type: 'string',
              description: 'Category name in Vietnamese'
            },
            name_ko: {
              type: 'string',
              description: 'Category name in Korean'
            },
            slug: {
              type: 'string',
              description: 'Category slug'
            },
            key: {
              type: 'string',
              description: 'Category key (for frontend, snake_case format: about_us)'
            },
            description: {
              type: 'string',
              description: 'Category description'
            },
            description_en: {
              type: 'string',
              description: 'Category description in English'
            },
            description_vi: {
              type: 'string',
              description: 'Category description in Vietnamese'
            },
            description_ko: {
              type: 'string',
              description: 'Category description in Korean'
            },
            parent: {
              type: 'string',
              description: 'Parent category ID'
            },
            isActive: {
              type: 'boolean',
              description: 'Category active status'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Category status (deprecated, use isActive)'
            },
            metaTitle: {
              type: 'string',
              description: 'SEO meta title'
            },
            metaDescription: {
              type: 'string',
              description: 'SEO meta description'
            },
            featuredImage: {
              type: 'string',
              description: 'Featured image URL'
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              description: 'Category color (hex format)'
            },
            icon: {
              type: 'string',
              description: 'Category icon'
            },
            sortOrder: {
              type: 'integer',
              description: 'Sort order'
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Category'
              },
              description: 'Child categories'
            },
            posts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Post'
              },
              description: 'Posts in this category'
            },
            postsCount: {
              type: 'integer',
              description: 'Number of posts in this category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        CategoryTree: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            name_en: {
              type: 'string',
              description: 'Category name in English'
            },
            name_vi: {
              type: 'string',
              description: 'Category name in Vietnamese'
            },
            name_ko: {
              type: 'string',
              description: 'Category name in Korean'
            },
            slug: {
              type: 'string',
              description: 'Category slug'
            },
            key: {
              type: 'string',
              description: 'Category key (for frontend, snake_case format: about_us)'
            },
            description: {
              type: 'string',
              description: 'Category description'
            },
            description_en: {
              type: 'string',
              description: 'Category description in English'
            },
            description_vi: {
              type: 'string',
              description: 'Category description in Vietnamese'
            },
            description_ko: {
              type: 'string',
              description: 'Category description in Korean'
            },
            parent: {
              type: 'string',
              description: 'Parent category ID'
            },
            isActive: {
              type: 'boolean',
              description: 'Category active status'
            },
            sortOrder: {
              type: 'integer',
              description: 'Sort order'
            },
            children: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CategoryTree'
              },
              description: 'Child categories'
            },
            postsCount: {
              type: 'integer',
              description: 'Number of posts in this category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category last update date'
            },
            __v: {
              type: 'integer',
              description: 'Mongoose version key'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            bio: {
              type: 'string',
              description: 'User biography'
            },
            avatar: {
              type: 'string',
              description: 'Avatar image URL'
            },
            role: {
              type: 'string',
              enum: ['admin', 'editor', 'author', 'subscriber'],
              description: 'User role'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'pending'],
              description: 'User status'
            },
            posts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Post'
              },
              description: 'User posts'
            },
            postsCount: {
              type: 'integer',
              description: 'Number of posts by user'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Photo: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Photo ID'
            },
            filename: {
              type: 'string',
              description: 'Generated filename'
            },
            originalName: {
              type: 'string',
              description: 'Original filename'
            },
            mimetype: {
              type: 'string',
              description: 'File MIME type'
            },
            size: {
              type: 'integer',
              description: 'File size in bytes'
            },
            url: {
              type: 'string',
              description: 'File URL'
            },
            path: {
              type: 'string',
              description: 'File path on server'
            },
            alt: {
              type: 'string',
              description: 'Alt text for accessibility'
            },
            caption: {
              type: 'string',
              description: 'Image caption'
            },
            position: {
              type: 'integer',
              description: 'Position of image in post',
              default: 0
            },
            postId: {
              type: 'string',
              description: 'Associated post ID'
            },
            userId: {
              type: 'string',
              description: 'Associated user ID'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'deleted'],
              description: 'Photo status'
            },
            altText: {
              type: 'string',
              description: 'SEO alt text'
            },
            title: {
              type: 'string',
              description: 'Photo title'
            },
            extension: {
              type: 'string',
              description: 'File extension'
            },
            sizeFormatted: {
              type: 'string',
              description: 'Human readable file size'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(swaggerOptions);

export const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Vinpet API Documentation',
};
