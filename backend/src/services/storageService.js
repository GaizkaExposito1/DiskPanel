const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config/config');
const { diskAppRoot } = require('./diskService');

// Carpetas permitidas en C:\ (nombres en inglés y español)
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

function isCDrive(mountPath) {
  return mountPath && mountPath.toUpperCase().startsWith('C:');
}

function ensureAppRoot(mountPath) {
  // C:\ siempre usa sandbox por seguridad
  if (isCDrive(mountPath) || config.sandboxMode) {
    const root = diskAppRoot(mountPath);
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    return root;
  } else {
    // Otros discos: acceso completo si sandboxMode está desactivado
    return mountPath;
  }
}

function listDirectory(mountPath, relPath = '.') {
  try {
    let target;
    const isCDriveAccess = isCDrive(mountPath);
    
    // Para C:\ raíz, acceder directamente a las carpetas del usuario (no sandbox)
    if (isCDriveAccess && relPath === '.') {
      // Listar carpetas permitidas del usuario en C:\Users\[username]\
      const homeDir = os.homedir();
      const entries = fs.readdirSync(homeDir, { withFileTypes: true });
      
      console.log('listDirectory - C: root access, homeDir:', homeDir, 'found', entries.length, 'entries');
      
      // Filtrar solo carpetas que estén en ALLOWED_C_FOLDERS
      const filtered = entries.filter(e => {
        if (!e.isDirectory()) return false;
        return ALLOWED_C_FOLDERS.includes(e.name);
      });
      
      // También incluir carpetas personalizadas creadas en C:\ raíz
      const customFoldersFile = path.join(homeDir, '.custom_c_folders.json');
      let customFolders = [];
      try {
        if (fs.existsSync(customFoldersFile)) {
          const data = fs.readFileSync(customFoldersFile, 'utf8');
          const allCustom = JSON.parse(data) || [];
          // Filtrar solo las carpetas de primer nivel (no las que están dentro de carpetas permitidas)
          customFolders = allCustom.filter(f => !f.includes('/'));
        }
      } catch (err) {
        console.log('Could not read custom folders:', err.message);
      }
      
      // Combinar carpetas permitidas con personalizadas
      const allFolders = [
        ...filtered.map(e => ({
          name: e.name,
          isDirectory: true,
          size: '--',
          isCustom: false
        })),
        ...customFolders.map(f => ({
          name: f,
          isDirectory: true,
          size: '--',
          isCustom: true
        }))
      ];
      
      console.log('listDirectory - returning', allFolders.length, 'folders (allowed + custom)');
      
      return allFolders;
    }
    
    // Para carpetas dentro de C:\ (Desktop, Documents, etc.), acceder directamente
    if (isCDriveAccess && relPath !== '.') {
      const homeDir = os.homedir();
      const folderName = relPath.split('/')[0]; // Obtener el nombre de la primera carpeta
      
      // Verificar que la carpeta está en la lista permitida
      if (!ALLOWED_C_FOLDERS.includes(folderName)) {
        console.log('listDirectory - folder not allowed:', folderName);
        return [];
      }
      
      // Construir la ruta real a la carpeta permitida
      target = path.join(homeDir, relPath);
      
      console.log('listDirectory - C: subfolder access, folderName:', folderName, 'target:', target);
      
      if (!fs.existsSync(target)) {
        console.log('listDirectory - target does not exist:', target);
        return [];
      }
      
      const entries = fs.readdirSync(target, { withFileTypes: true });
      console.log('listDirectory - found', entries.length, 'entries in', folderName);
      
      // Filtrar archivos/carpetas del sistema y ocultos
      let filtered = entries.filter(e => {
        const fullPath = path.join(target, e.name);
        
        // Filtrar archivos/carpetas que empiezan con punto (ocultos en Unix)
        if (e.name.startsWith('.')) return false;
        
        // Filtrar carpetas del sistema comunes de Windows
        const systemFolders = [
          '$Recycle.Bin', 
          'System Volume Information', 
          '$RECYCLE.BIN'
        ];
        
        if (systemFolders.includes(e.name)) return false;
        
        try {
          const stats = fs.statSync(fullPath);
          return true;
        } catch(err) {
          console.log('Cannot read:', fullPath, err.message);
          return false;
        }
      });
      
      console.log('listDirectory - returning', filtered.length, 'entries (after filtering)');
      
      // Mapear con información de tamaño
      return filtered.map(e => {
        const fullPath = path.join(target, e.name);
        let size = 0;
        
        try {
          if (e.isDirectory()) {
            size = 0; // No calcular tamaño de carpetas
          } else {
            const stats = fs.statSync(fullPath);
            size = stats.size;
          }
        } catch(err) {
          console.error('Error getting size for:', e.name, err.message);
        }
        
        return { 
          name: e.name, 
          isDirectory: e.isDirectory(),
          size: size
        };
      });
    }
    
    // Para otros casos, usar la lógica normal
    const useSandbox = config.sandboxMode;
    
    if (useSandbox) {
      // Modo sandbox para otros discos
      const root = diskAppRoot(mountPath);
      if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
      target = relPath === '.' ? root : path.join(root, relPath);
      const normalizedTarget = path.normalize(target).toLowerCase();
      const normalizedRoot = path.normalize(root).toLowerCase();
      if (!normalizedTarget.startsWith(normalizedRoot)) {
        throw new Error('Path traversal detected');
      }
    } else {
      // Acceso directo a otros discos
      target = relPath === '.' ? mountPath : path.join(mountPath, relPath);
    }
    
    console.log('listDirectory - other disk access, mountPath:', mountPath, 'relPath:', relPath, 'target:', target, 'useSandbox:', useSandbox);
    
    if (!fs.existsSync(target)) {
      console.log('listDirectory - target does not exist');
      return [];
    }
    
    const entries = fs.readdirSync(target, { withFileTypes: true });
    console.log('listDirectory - found', entries.length, 'entries (before filtering)');
    
    // Filtrar archivos/carpetas del sistema y ocultos
    let filtered = entries.filter(e => {
      const fullPath = path.join(target, e.name);
      
      // Filtrar archivos/carpetas que empiezan con punto (ocultos en Unix)
      if (e.name.startsWith('.')) return false;
      
      // Filtrar carpetas del sistema comunes de Windows
      const systemFolders = [
        '$Recycle.Bin', 
        'System Volume Information', 
        '$RECYCLE.BIN',
        'Recovery',
        'PerfLogs',
        'ProgramData',
        'Windows',
        'Program Files',
        'Program Files (x86)',
        'Users'
      ];
      
      if (systemFolders.includes(e.name)) return false;
      
      // Intentar leer atributos de Windows para detectar archivos ocultos/sistema
      try {
        const stats = fs.statSync(fullPath);
        
        // Filtrar archivos del sistema comunes
        const systemFiles = [
          'pagefile.sys',
          'hiberfil.sys',
          'swapfile.sys',
          'DumpStack.log',
          'DumpStack.log.tmp',
          'bootmgr',
          'BOOTNXT'
        ];
        
        if (systemFiles.includes(e.name.toLowerCase())) return false;
        
        return true;
      } catch(err) {
        // Si no podemos leer el archivo, probablemente es del sistema
        console.log('Cannot read:', fullPath, err.message);
        return false;
      }
    });
    
    console.log('listDirectory - returning', filtered.length, 'entries (after filtering)');;
    
    // Mapear con información de tamaño
    return filtered.map(e => {
      const fullPath = path.join(target, e.name);
      let size = 0;
      
      try {
        if (e.isDirectory()) {
          // No calcular el tamaño de carpetas para mejorar rendimiento
          size = 0;
        } else {
          // Tamaño del archivo
          const stats = fs.statSync(fullPath);
          size = stats.size;
        }
      } catch(err) {
        console.error('Error getting size for:', e.name, err.message);
      }
      
      return { 
        name: e.name, 
        isDirectory: e.isDirectory(),
        size: size
      };
    });
  } catch(err) {
    console.error('listDirectory error:', err);
    throw err;
  }
}

// Función auxiliar para calcular el tamaño de una carpeta recursivamente
function getDirectorySize(dirPath, maxDepth = 5, currentDepth = 0) {
  let totalSize = 0;
  
  // Evitar recursión infinita limitando la profundidad
  if (currentDepth >= maxDepth) {
    return 0;
  }
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          // Evitar carpetas del sistema que pueden causar problemas
          if (entry.name.startsWith('$') || entry.name === 'System Volume Information') {
            continue;
          }
          totalSize += getDirectorySize(fullPath, maxDepth, currentDepth + 1);
        } else {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        }
      } catch(err) {
        // Ignorar archivos que no se pueden leer (sin logging para no saturar)
      }
    }
  } catch(err) {
    // Ignorar directorios que no se pueden leer
  }
  
  return totalSize;
}

function statFile(mountPath, relPath) {
  const isCDriveAccess = isCDrive(mountPath);
  
  // Para C:\, acceder a la carpeta real del usuario
  if (isCDriveAccess) {
    const homeDir = os.homedir();
    const folderName = relPath.split('/')[0];
    const parts = relPath.split('/');
    
    // Si es de primer nivel (carpeta personalizada en C:\ raíz), permitir acceso
    if (parts.length === 1) {
      const p = path.join(homeDir, relPath);
      const homeNorm = path.normalize(homeDir).toLowerCase();
      const pNorm = path.normalize(p).toLowerCase();
      
      if (!pNorm.startsWith(homeNorm)) {
        throw new Error('Path traversal detected');
      }
      
      return fs.statSync(p);
    }
    
    // Si está dentro de una carpeta permitida, verificar permiso
    if (!ALLOWED_C_FOLDERS.includes(folderName)) {
      throw new Error('Access denied to this folder');
    }
    
    const p = path.join(homeDir, relPath);
    const homeNorm = path.normalize(homeDir).toLowerCase();
    const pNorm = path.normalize(p).toLowerCase();
    
    // Verificar que no hay path traversal
    if (!pNorm.startsWith(homeNorm)) {
      throw new Error('Path traversal detected');
    }
    
    return fs.statSync(p);
  }
  
  // Para otros discos, usar la lógica original
  const root = ensureAppRoot(mountPath);
  const p = path.join(root, relPath);
  const useSandbox = config.sandboxMode;
  
  if (useSandbox) {
    const normalizedP = path.normalize(p).toLowerCase();
    const normalizedRoot = path.normalize(root).toLowerCase();
    if (!normalizedP.startsWith(normalizedRoot)) {
      throw new Error('Path traversal detected');
    }
  }
  
  return fs.statSync(p);
}

function createFolder(mountPath, relPath) {
  const isCDriveAccess = isCDrive(mountPath);
  
  // Para C:\, acceder a la carpeta real del usuario
  if (isCDriveAccess) {
    const homeDir = os.homedir();
    const parts = relPath.split('/');
    const folderName = parts[0];
    
    // Si es una carpeta de primer nivel (creando directamente en C:\ raíz)
    if (parts.length === 1) {
      // Crear la carpeta como carpeta personalizada
      const p = path.join(homeDir, relPath);
      const homeNorm = path.normalize(homeDir).toLowerCase();
      const pNorm = path.normalize(p).toLowerCase();
      
      // Verificar que no hay path traversal
      if (!pNorm.startsWith(homeNorm)) {
        throw new Error('Path traversal detected');
      }
      
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      
      // Registrar como carpeta personalizada en C:\ raíz
      const customFoldersFile = path.join(homeDir, '.custom_c_folders.json');
      try {
        let customFolders = [];
        if (fs.existsSync(customFoldersFile)) {
          const data = fs.readFileSync(customFoldersFile, 'utf8');
          customFolders = JSON.parse(data) || [];
        }
        
        if (!customFolders.includes(relPath)) {
          customFolders.push(relPath);
          fs.writeFileSync(customFoldersFile, JSON.stringify(customFolders, null, 2));
          console.log('Registered custom folder at root:', relPath);
        }
      } catch (err) {
        console.log('Could not register custom folder:', err.message);
      }
      
      return true;
    }
    
    // Si es una carpeta dentro de una carpeta permitida
    if (!ALLOWED_C_FOLDERS.includes(folderName)) {
      throw new Error('Access denied to this folder');
    }
    
    const p = path.join(homeDir, relPath);
    const homeNorm = path.normalize(homeDir).toLowerCase();
    const pNorm = path.normalize(p).toLowerCase();
    
    // Verificar que no hay path traversal
    if (!pNorm.startsWith(homeNorm)) {
      throw new Error('Path traversal detected');
    }
    
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    
    // Si es una carpeta de segundo nivel (dentro de una carpeta permitida), registrarla como custom
    if (parts.length === 2) {
      const customFoldersFile = path.join(homeDir, '.custom_c_folders.json');
      try {
        let customFolders = [];
        if (fs.existsSync(customFoldersFile)) {
          const data = fs.readFileSync(customFoldersFile, 'utf8');
          customFolders = JSON.parse(data) || [];
        }
        
        // Agregar si no existe
        if (!customFolders.includes(relPath)) {
          customFolders.push(relPath);
          fs.writeFileSync(customFoldersFile, JSON.stringify(customFolders, null, 2));
          console.log('Registered custom folder:', relPath);
        }
      } catch (err) {
        console.log('Could not register custom folder:', err.message);
      }
    }
    
    return true;
  }
  
  // Para otros discos, usar la lógica original
  const root = ensureAppRoot(mountPath);
  const p = path.join(root, relPath);
  const useSandbox = config.sandboxMode;
  
  if (useSandbox) {
    const normalizedP = path.normalize(p).toLowerCase();
    const normalizedRoot = path.normalize(root).toLowerCase();
    if (!normalizedP.startsWith(normalizedRoot)) {
      throw new Error('Path traversal detected');
    }
  }
  
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return true;
}

function removePath(mountPath, relPath) {
  const isCDriveAccess = isCDrive(mountPath);
  
  // Para C:\, acceder a la carpeta real del usuario
  if (isCDriveAccess) {
    const homeDir = os.homedir();
    const folderName = relPath.split('/')[0];
    const parts = relPath.split('/');
    
    // Proteger carpetas por defecto: no se pueden eliminar
    if (parts.length === 1 && ALLOWED_C_FOLDERS.includes(relPath)) {
      throw new Error('Cannot delete default folder');
    }
    
    // Verificar acceso: si es de segundo nivel o más, debe estar en carpeta permitida
    if (parts.length > 1 && !ALLOWED_C_FOLDERS.includes(folderName)) {
      throw new Error('Access denied to this folder');
    }
    
    const p = path.join(homeDir, relPath);
    const homeNorm = path.normalize(homeDir).toLowerCase();
    const pNorm = path.normalize(p).toLowerCase();
    
    // Verificar que no hay path traversal
    if (!pNorm.startsWith(homeNorm)) {
      throw new Error('Path traversal detected');
    }
    
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        // Verificar si la carpeta está vacía
        const entries = fs.readdirSync(p);
        if (entries.length > 0) {
          throw new Error('Folder is not empty');
        }
        fs.rmSync(p, { recursive: true });
      } else {
        fs.unlinkSync(p);
      }
    }
    
    // Si es una carpeta personalizada (de primer o segundo nivel), eliminarla del registro
    if (parts.length === 1 || parts.length === 2) {
      const customFoldersFile = path.join(homeDir, '.custom_c_folders.json');
      try {
        if (fs.existsSync(customFoldersFile)) {
          let customFolders = JSON.parse(fs.readFileSync(customFoldersFile, 'utf8')) || [];
          customFolders = customFolders.filter(f => f !== relPath);
          fs.writeFileSync(customFoldersFile, JSON.stringify(customFolders, null, 2));
          console.log('Unregistered custom folder:', relPath);
        }
      } catch (err) {
        console.log('Could not unregister custom folder:', err.message);
      }
    }
    
    return true;
  }
  
  // Para otros discos, usar la lógica original
  const root = ensureAppRoot(mountPath);
  const p = path.join(root, relPath);
  const useSandbox = config.sandboxMode;
  
  if (useSandbox) {
    const normalizedP = path.normalize(p).toLowerCase();
    const normalizedRoot = path.normalize(root).toLowerCase();
    if (!normalizedP.startsWith(normalizedRoot)) {
      throw new Error('Path traversal detected');
    }
  }
  
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      // Verificar si la carpeta está vacía
      const entries = fs.readdirSync(p);
      if (entries.length > 0) {
        throw new Error('Folder is not empty');
      }
      fs.rmSync(p, { recursive: true });
    } else {
      fs.unlinkSync(p);
    }
  }
}

function renamePath(mountPath, relOld, relNew) {
  const isCDriveAccess = isCDrive(mountPath);
  
  // Para C:\, acceder a la carpeta real del usuario
  if (isCDriveAccess) {
    const homeDir = os.homedir();
    const folderName = relOld.split('/')[0];
    const parts = relOld.split('/');
    
    // Proteger carpetas por defecto: no se pueden renombrar
    if (parts.length === 1 && ALLOWED_C_FOLDERS.includes(relOld)) {
      throw new Error('Cannot rename default folder');
    }
    
    // Verificar acceso: si es de segundo nivel o más, debe estar en carpeta permitida
    if (parts.length > 1 && !ALLOWED_C_FOLDERS.includes(folderName)) {
      throw new Error('Access denied to this folder');
    }
    
    const oldP = path.join(homeDir, relOld);
    const newP = path.join(homeDir, relNew);
    const homeNorm = path.normalize(homeDir).toLowerCase();
    const oldPNorm = path.normalize(oldP).toLowerCase();
    const newPNorm = path.normalize(newP).toLowerCase();
    
    // Verificar que no hay path traversal
    if (!oldPNorm.startsWith(homeNorm) || !newPNorm.startsWith(homeNorm)) {
      throw new Error('Path traversal detected');
    }
    
    fs.renameSync(oldP, newP);
    return true;
  }
  
  // Para otros discos, usar la lógica original
  const root = ensureAppRoot(mountPath);
  const oldP = path.join(root, relOld);
  const newP = path.join(root, relNew);
  const useSandbox = config.sandboxMode;
  
  if (useSandbox) {
    const normalizedOldP = path.normalize(oldP).toLowerCase();
    const normalizedNewP = path.normalize(newP).toLowerCase();
    const normalizedRoot = path.normalize(root).toLowerCase();
    if (!normalizedOldP.startsWith(normalizedRoot) || !normalizedNewP.startsWith(normalizedRoot)) {
      throw new Error('Path traversal detected');
    }
  }
  
  fs.renameSync(oldP, newP);
}

module.exports = { ensureAppRoot, listDirectory, statFile, createFolder, removePath, renamePath };
