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
  },
  apis: ['./src/routes/*.js'], // where your route comments will live
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;