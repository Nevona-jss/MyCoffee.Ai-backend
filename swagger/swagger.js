const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyCoffee.Ai API',
      version: '1.0.0',
      description: 'A personalized coffee recommendation platform API',
      contact: {
        name: 'MyCoffee.Ai Team',
        email: 'support@mycoffee.ai',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
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
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            error: {
              type: 'object',
              description: 'Error details (development only)',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        CoffeePreferences: {
          type: 'object',
          required: ['aroma', 'acidity', 'nutty', 'body', 'sweetness'],
          properties: {
            aroma: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Aroma preference score',
            },
            acidity: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Acidity preference score',
            },
            nutty: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Nutty flavor preference score',
            },
            body: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Body preference score',
            },
            sweetness: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Sweetness preference score',
            },
            userId: {
              type: 'integer',
              description: 'User ID (optional)',
            },
            saveAnalysis: {
              type: 'integer',
              enum: [0, 1],
              default: 0,
              description: 'Save analysis flag',
            },
          },
        },
        CoffeeRecommendation: {
          type: 'object',
          properties: {
            coffee_id: {
              type: 'integer',
              description: 'Coffee ID',
            },
            name: {
              type: 'string',
              description: 'Coffee name',
            },
            description: {
              type: 'string',
              description: 'Coffee description',
            },
            match_score: {
              type: 'number',
              description: 'Match score with user preferences',
            },
            category: {
              type: 'string',
              description: 'Coffee category',
            },
            origin: {
              type: 'string',
              description: 'Coffee origin',
            },
            roast_level: {
              type: 'string',
              description: 'Roast level',
            },
            price: {
              type: 'number',
              description: 'Coffee price',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Authenticated',
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT token',
                },
                user: {
                  type: 'object',
                  properties: {
                    sub: {
                      type: 'string',
                      description: 'Subject identifier',
                    },
                    provider: {
                      type: 'string',
                      description: 'OAuth provider',
                    },
                    email: {
                      type: 'string',
                      description: 'User email',
                    },
                    name: {
                      type: 'string',
                      description: 'User display name',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication with OAuth Providers',
        description: 'OAuth authentication endpoints',
      },
      {
        name: 'Coffee Recommendation',
        description: 'Coffee preference analysis and recommendations',
      },
      {
        name: 'Coffee Collection',
        description: 'Coffee collection management API',
      },
    ],
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './swagger/*.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};
