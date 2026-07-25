const pool = require('../../../database/connection');

exports.getAllProducts = async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const result = await pool.query(
    includeInactive
      ? 'SELECT * FROM products ORDER BY id'
      : 'SELECT * FROM products WHERE is_active = true ORDER BY id'
  );
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
    'UPDATE products SET is_active = false WHERE id = $1 RETURNING *', [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.sendStatus(204);
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, is_active } = req.body;

  const result = await pool.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         price = COALESCE($2, price),
         description = COALESCE($3, description),
         is_active = COALESCE($4, is_active)
     WHERE id = $5
     RETURNING *`,
    [name, price, description, is_active, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(result.rows[0]);
};