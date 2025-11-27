const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// simple auth using ADMIN_USER/ADMIN_PASS from env
async function login(req, res) {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'changeme';
  if (!username || !password) return res.status(400).json({ error: req.t('error.missing_credentials') });
  if (username !== adminUser) return res.status(401).json({ error: req.t('error.invalid_credentials') });
  const ok = (password === adminPass) || await bcrypt.compare(password, adminPass);
  if (!ok) return res.status(401).json({ error: req.t('error.invalid_credentials') });
  const token = jwt.sign({ username }, process.env.JWT_SECRET || config.jwtSecret, { expiresIn: '8h' });
  res.json({ token, msg: req.t('auth.login_success') });
}

module.exports = { login };
