require('dotenv').config();
const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

const PORT = process.env.PORT || config.port || 4000;

const HOST = process.env.HOST || config.host || '0.0.0.0';
app.listen(PORT, HOST, () => {
  logger.info(`Server started on ${HOST}:${PORT}`);
  console.log(`Server running on http://${HOST}:${PORT}`);
});
