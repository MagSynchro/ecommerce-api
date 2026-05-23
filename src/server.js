const app = require('./app');
const pool = require('./db');
require('dotenv').config();

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection error', err);
  } else {
    console.log('DB connected:', res.rows);
  }
});

const PORT = process.env.SERVER_PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});