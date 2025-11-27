const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');
const config = require('./config/config');
const authRoutes = require('./routes/auth');
const disksRoutes = require('./routes/disks');
const filesRoutes = require('./routes/files');
const logger = require('./utils/logger');

const app = express();

// i18n setup
i18next.use(Backend).use(middleware.LanguageDetector).init({
  fallbackLng: process.env.DEFAULT_LANG || 'es',
  preload: ['es','en'],
  backend: {
    loadPath: path.join(__dirname, 'locales/{{lng}}/translation.json')
  },
  detection: {
    order: ['cookie','header'],
    caches: ['cookie']
  }
});

app.use(middleware.handle(i18next));

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend en producción
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/disks', disksRoutes);
app.use('/api/files', filesRoutes);

// Servir index.html para rutas no encontradas (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ error: req.t ? req.t('error.not_found') : 'Not found' });
    }
  });
});

// error handler
app.use((err, req, res, next) => {
  logger.error(err);
  const msg = req && req.t ? req.t('error.internal') : 'Internal server error';
  res.status(500).json({ error: msg });
});

module.exports = app;
