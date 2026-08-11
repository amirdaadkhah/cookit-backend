const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.loginAdmin = async (username, password) => {
  const user = await db.query(
    'SELECT * FROM admins WHERE username=$1',
    [username]
  );

  if (!user.rows.length) return null;

  const valid = await bcrypt.compare(password, user.rows[0].password);
  if (!valid) return null;

  return jwt.sign(
    { role: 'admin', id: user.rows[0].id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};