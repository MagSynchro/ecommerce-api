//router.post('/login', (req, res) => {
//  res.status(201).json({message: 'User Login'});
//});
//router.post('/register', (req, res) => {
//  res.status(201).json({message: 'User Registered'});
//});

const pool = require('../db');

exports.getAllUsers = async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(result.rows[0]);
};

exports.createUser = async (req, res) => {
  const { email, password } = req.body;

  //logic to salt and hash password before storing.

  try {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING *`,
      [email, password]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeUser = async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING *', [id]
  );
  
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.sendStatus(204);
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password_hash } = req.body;

  const result = await pool.query(
    `UPDATE users
     SET email = $1, password_hash = $2
     WHERE id = $3
     RETURNING *`,
    [email, password_hash, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(result.rows[0]);
};