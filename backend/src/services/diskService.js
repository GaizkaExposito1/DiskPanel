const drivelist = require('drivelist');
const { exec } = require('child_process');
const path = require('path');
const config = require('../config/config');

async function listDisks() {
  // Usar wmic directamente es más confiable en Windows
  return new Promise((resolve, reject) => {
    exec('wmic logicaldisk get name,filesystem,size,freespace /format:csv', (err, stdout) => {
      if (err) {
        console.error('Error listing disks:', err);
        return resolve([]);
      }
      try {
        const lines = stdout.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('Node'));
        const disks = lines.map(line => {
          const parts = line.split(',');
          if (parts.length < 5) return null;
          // CSV columns: Node,FileSystem,FreeSpace,Name,Size
          const name = (parts[3] || '').trim();
          const free = parseInt(parts[2]) || 0;
          const size = parseInt(parts[4]) || 0;
          const used = size - free;
          
          if (!name) return null;
          
          return { 
            id: name, 
            mount: name.endsWith(':') ? name + '\\' : name,
            filesystem: (parts[1] || '').trim(), 
            free: free, 
            size: size,
            used: used,
            isRemovable: false
          };
        }).filter(Boolean);
        console.log('Found disks:', disks.length);
        resolve(disks);
      } catch(e) {
        console.error('Error parsing wmic output:', e);
        resolve([]);
      }
    });
  });
}

function diskAppRoot(mountPath) {
  // mountPath like 'D:\' or 'C:\'
  return path.join(mountPath, config.appRootFolderName);
}

module.exports = { listDisks, diskAppRoot };
