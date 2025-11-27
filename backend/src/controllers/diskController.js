const { listDisks, diskAppRoot } = require('../services/diskService');
const { ensureAppRoot } = require('../services/storageService');
const config = require('../config/config');

async function list(req, res) {
  try {
    const drives = await listDisks();
    console.log('Disks received:', drives);
    // normalize for frontend
    const normalized = (drives || []).map(d => {
      const m = d.mount || d.id;
      const appRoot = m ? diskAppRoot(m) : null;
      return {
        id: d.id || m,
        mount: m,
        description: d.description || d.filesystem || null,
        total: d.size || 0,
        free: d.free || 0,
        used: d.used || 0,
        isRemovable: d.isRemovable || false,
        appRoot: appRoot,
        appRootExists: appRoot ? !!(require('fs').existsSync(appRoot)) : false
      };
    });
    res.json({ 
      disks: normalized,
      refreshInterval: config.dashboardRefreshInterval 
    });
  } catch (e) {
    console.error('Error listing disks:', e);
    res.status(500).json({ error: req.t('error.list_disks_failed') });
  }
}

module.exports = { list };
