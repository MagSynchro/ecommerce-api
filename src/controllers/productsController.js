const pool = require('../db');

exports.getAllProducts = async (req, res) => {
  const result = await pool.query('SELECT * FROM products');
  res.json(result.rows);
};

exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(result.rows[0]);
};

exports.createProduct = async (req, res) => {
  const { name, price, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products (name, price, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, price, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Product already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeProduct = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 RETURNING *', [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.sendStatus(204);
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;

  const result = await pool.query(
    `UPDATE products
     SET name = $1,
         price = $2,
         description = $3
     WHERE id = $4
     RETURNING *`,
    [name, price, description, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(result.rows[0]);
};