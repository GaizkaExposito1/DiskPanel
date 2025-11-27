const path = require('path');

module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'changeme_jwt_secret',
  appRootFolderName: process.env.APP_ROOT_FOLDER || 'miapp_storage',
  sandboxMode: process.env.SANDBOX_MODE === 'true',
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '104857600', 10),
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || '.txt,.pdf,.jpg,.png,.zip,.docx').split(',').map(s => s.trim()),
  dashboardRefreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL || '60000', 10), // ms (default: 60000 = 1 minuto)
  baseDir: path.resolve(__dirname, '..')
};
