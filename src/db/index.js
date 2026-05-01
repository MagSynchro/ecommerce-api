const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce-api-project',
  password: 'N1nt3nd0!',
  port: 6644,
});

module.exports = pool;