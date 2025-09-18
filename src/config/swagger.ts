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
