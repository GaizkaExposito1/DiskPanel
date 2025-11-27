const { listDirectory, ensureAppRoot, statFile, createFolder, removePath, renamePath } = require('../services/storageService');
const { uploadMiddleware } = require('../services/uploadService');
const { listDisks } = require('../services/diskService');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

function isCDrive(mountPath) {
  return mountPath && mountPath.toUpperCase().startsWith('C:');
}

function getMount(req) {
  const disk = req.query.disk || req.body.disk;
  if (!disk) throw new Error('missing_disk');
  return disk;
}

async function list(req, res) {
  try {
    const disk = getMount(req);
    const rel = req.query.path || '.';
    const list = listDirectory(disk, rel);
    res.json({ entries: list });
  } catch (e) {
    res.status(400).json({ error: req.t ? req.t('error.invalid_path') : 'Invalid path' });
  }
}

async function upload(req, res) {
  try {
    console.log('fileController.upload - query:', req.query, 'body:', req.body);
    // Obtener disk y path desde query params en lugar de body
    const disk = req.query.disk;
    const rel = req.query.path || '.';
    console.log('fileController.upload - disk:', disk, 'path:', rel);
    
    if (!disk) {
      console.log('fileController.upload - ERROR: missing disk');
      return res.status(400).json({ error: 'Falta especificar el disco' });
    }
    
    // Deshabilitar upload en C:\ raíz (solo en carpetas permitidas dentro de C:)
    if (isCDrive(disk) && rel === '.') {
      console.log('fileController.upload - ERROR: Upload not allowed at C: root');
      return res.status(403).json({ 
        error: req.t('error.upload_disabled_at_root') || 'No se permite subir archivos en la raíz de C:. Por favor, ingresa en una carpeta como Desktop, Documentos, etc.' 
      });
    }
    
    // Verificar espacio disponible (seguridad: no permitir si está al 95% o más)
    try {
      const disks = await listDisks();
      const targetDisk = disks.find(d => d.mount === disk || d.id === disk.replace('\\', ''));
      
      if (targetDisk) {
        const diskSize = targetDisk.size || 0;
        const diskUsed = targetDisk.used || 0;
        const usagePercent = diskSize > 0 ? (diskUsed / diskSize) * 100 : 0;
        
        console.log(`fileController.upload - Disk ${disk} usage: ${usagePercent.toFixed(2)}%`);
        
        if (usagePercent >= 95) {
          console.log('fileController.upload - ERROR: Disk almost full');
          return res.status(400).json({ 
            error: req.t('error.disk_full') || 'El disco está casi lleno (95% o más). No se pueden subir más archivos por seguridad.' 
          });
        }
      }
    } catch (diskCheckError) {
      console.log('fileController.upload - Warning: Could not check disk space:', diskCheckError.message);
      // Continuar con la subida si no se puede verificar el espacio
    }
    
    const mw = uploadMiddleware(disk, rel);
    mw(req, res, function (err) {
      if (err) {
        console.log('fileController.upload - ERROR:', err.message);
        const code = err.message === 'invalid_ext' ? req.t('error.invalid_extension') : err.message;
        return res.status(400).json({ error: code });
      }
      console.log('fileController.upload - SUCCESS:', req.file.filename);
      res.json({ msg: req.t('file.upload_success'), file: req.file.filename });
    });
  } catch (e) {
    console.log('fileController.upload - EXCEPTION:', e.message);
    res.status(400).json({ error: req.t('error.invalid_path') });
  }
}

function download(req, res) {
  try {
    const disk = req.query.disk;
    const rel = req.query.path;
    if (!disk || !rel) return res.status(400).json({ error: req.t('error.missing_params') });
    
    let p;
    
    // Para C:\, acceder a la carpeta real del usuario
    if (isCDrive(disk)) {
      const os = require('os');
      const homeDir = os.homedir();
      const folderName = rel.split('/')[0];
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
        return res.status(400).json({ error: req.t('error.invalid_path') });
      }
      
      p = path.join(homeDir, rel);
      const homeNorm = path.normalize(homeDir).toLowerCase();
      const pNorm = path.normalize(p).toLowerCase();
      
      // Verificar que no hay path traversal
      if (!pNorm.startsWith(homeNorm)) {
        return res.status(400).json({ error: req.t('error.invalid_path') });
      }
    } else {
      // Para otros discos, usar la lógica original
      const root = ensureAppRoot(disk);
      p = rel === '.' ? root : path.join(root, rel);
      const useSandbox = config.sandboxMode;
      
      // Validar path traversal si sandbox está activo
      if (useSandbox) {
        const normalizedP = path.normalize(p).toLowerCase();
        const normalizedRoot = path.normalize(root).toLowerCase();
        if (!normalizedP.startsWith(normalizedRoot)) {
          return res.status(400).json({ error: req.t('error.invalid_path') });
        }
      }
    }
    
    if (!fs.existsSync(p)) return res.status(404).json({ error: req.t('error.not_found') });
    
    const stats = fs.statSync(p);
    
    // Si es un archivo, descarga directa
    if (stats.isFile()) {
      return res.download(p);
    }
    
    // Si es una carpeta, crear un ZIP
    if (stats.isDirectory()) {
      const folderName = path.basename(p);
      const zipName = `${folderName}.zip`;
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      
      const archive = archiver('zip', {
        zlib: { level: 9 } // Máxima compresión
      });
      
      archive.on('error', function(err) {
        console.error('Error creating zip:', err);
        res.status(500).json({ error: req.t('error.internal') });
      });
      
      archive.pipe(res);
      
      // Agregar la carpeta completa al ZIP
      archive.directory(p, false);
      
      archive.finalize();
      return;
    }
    
    res.status(400).json({ error: req.t('error.invalid_path') });
  } catch (e) {
    console.error('Download error:', e);
    res.status(400).json({ error: req.t('error.invalid_path') });
  }
}

function mkdir(req, res) {
  try {
    const disk = req.body.disk;
    const rel = req.body.path;
    if (!disk || !rel) return res.status(400).json({ error: req.t('error.missing_params') });
    createFolder(disk, rel);
    res.json({ msg: req.t('file.mkdir_success') });
  } catch (e) {
    res.status(400).json({ error: req.t('error.invalid_path') });
  }
}

function rename(req, res) {
  try {
    const disk = req.body.disk;
    const oldp = req.body.oldPath;
    const newp = req.body.newPath;
    if (!disk || !oldp || !newp) return res.status(400).json({ error: req.t('error.missing_params') });
    renamePath(disk, oldp, newp);
    res.json({ msg: req.t('file.rename_success') });
  } catch (e) {
    res.status(400).json({ error: req.t('error.invalid_path') });
  }
}

function remove(req, res) {
  try {
    const disk = req.body.disk;
    const rel = req.body.path;
    if (!disk || !rel) return res.status(400).json({ error: req.t('error.missing_params') });
    removePath(disk, rel);
    res.json({ msg: req.t('file.delete_success') });
  } catch (e) {
    console.log('fileController.remove - ERROR:', e.message);
    // Manejar errores específicos
    if (e.message === 'Folder is not empty') {
      return res.status(400).json({ error: req.t('error.folder_not_empty') });
    }
    if (e.message === 'Cannot delete default folder') {
      return res.status(403).json({ error: 'Cannot delete default folder' });
    }
    res.status(400).json({ error: req.t('error.invalid_path') });
  }
}

module.exports = { list, upload, download, mkdir, rename, remove };
