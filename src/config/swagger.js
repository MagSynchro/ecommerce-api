const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'Simple e-commerce REST API with Express and PostgreSQL',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],


    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            email: {
              type: 'string'
            }
          }
        },

        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' }
          }
        },

        CartItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' }
          }
        },

        Order: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            order_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            price_at_time: { type: 'number' }
          }
        }


      }
    }
  },

  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;