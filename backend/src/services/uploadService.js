const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const config = require('../config/config');
const { ensureAppRoot } = require('./storageService');

function extensionAllowed(filename) {
  const ext = path.extname(filename).toLowerCase();
  return config.allowedExtensions.includes(ext);
}

function isCDrive(mountPath) {
  return mountPath && mountPath.toUpperCase().startsWith('C:');
}

function storageFor(mountPath, relPath) {
  console.log('uploadService.storageFor - mountPath:', mountPath, 'relPath:', relPath);
  
  let dest;
  
  // Para C:\, acceder a la carpeta real del usuario
  if (isCDrive(mountPath)) {
    const homeDir = os.homedir();
    const folderName = relPath.split('/')[0];
    const ALLOWED_C_FOLDERS = [
      'Desktop', 'Escritorio',
      'Documents', 'Documentos',
      'Downloads', 'Descargas',
      'Pictures', 'Imágenes',
      'Videos',
      'Music', 'Música',
      'Contacts', 'Contactos',
      '3D Objects'
    ];
    
    // Verificar que la carpeta está permitida
    if (!ALLOWED_C_FOLDERS.includes(folderName)) {
      throw new Error('Access denied to this folder');
    }
    
    dest = path.join(homeDir, relPath);
    const homeNorm = path.normalize(homeDir).toLowerCase();
    const destNorm = path.normalize(dest).toLowerCase();
    
    // Verificar que no hay path traversal
    if (!destNorm.startsWith(homeNorm)) {
      console.log('uploadService.storageFor - PATH TRAVERSAL DETECTED');
      throw new Error('Path traversal detected');
    }
  } else {
    // Para otros discos, usar la lógica original
    const root = ensureAppRoot(mountPath);
    console.log('uploadService.storageFor - root:', root);
    dest = relPath === '.' ? root : path.join(root, relPath);
    const useSandbox = config.sandboxMode;
    console.log('uploadService.storageFor - dest:', dest, 'useSandbox:', useSandbox);
    
    // Validar path traversal si sandbox está activo
    if (useSandbox) {
      // Normalizar paths para comparación correcta en Windows
      const normalizedDest = path.normalize(dest).toLowerCase();
      const normalizedRoot = path.normalize(root).toLowerCase();
      console.log('uploadService.storageFor - normalized dest:', normalizedDest, 'root:', normalizedRoot);
      if (!normalizedDest.startsWith(normalizedRoot)) {
        console.log('uploadService.storageFor - PATH TRAVERSAL DETECTED');
        throw new Error('Path traversal detected');
      }
    }
  }
  
  console.log('uploadService.storageFor - final dest:', dest);
  
  if (!fs.existsSync(dest)) {
    console.log('uploadService.storageFor - creating directory:', dest);
    fs.mkdirSync(dest, { recursive: true });
  }
  return multer.diskStorage({
    destination: function (req, file, cb) { cb(null, dest); },
    filename: function (req, file, cb) {
      // conflict resolver: add suffix
      const name = file.originalname;
      let target = path.join(dest, name);
      if (!fs.existsSync(target)) return cb(null, name);
      const parsed = path.parse(name);
      let i = 1;
      while (fs.existsSync(path.join(dest, `${parsed.name}(${i})${parsed.ext}`))) i++;
      cb(null, `${parsed.name}(${i})${parsed.ext}`);
    }
  });
}

function uploadMiddleware(mountPath, relPath) {
  const storage = storageFor(mountPath, relPath);
  const limits = { fileSize: config.maxUploadBytes };
  const fileFilter = function (req, file, cb) {
    if (!extensionAllowed(file.originalname)) return cb(new Error('invalid_ext'));
    cb(null, true);
  };
  return multer({ storage, limits, fileFilter }).single('file');
}

module.exports = { uploadMiddleware, extensionAllowed };
