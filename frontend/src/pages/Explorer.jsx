import React from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import UploadForm from '../components/UploadForm'
import FileRow from '../components/FileRow'
import FolderModal from '../components/FolderModal'
import DiskSpace from '../components/DiskSpace'
import QuickNavigator from '../components/QuickNavigator'

export default function Explorer({ disk, token }) {
  const { t } = useTranslation();
  const [path, setPath] = React.useState('.');
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showNewFolder, setShowNewFolder] = React.useState(false);
  const [showNavigator, setShowNavigator] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('name'); // 'name', 'size', 'type'
  const [sortOrder, setSortOrder] = React.useState('asc'); // 'asc', 'desc'

  // Calcular porcentaje de uso del disco
  const diskUsagePercent = React.useMemo(() => {
    if (!disk || !disk.total) return 0;
    const used = disk.used || (disk.total - disk.free);
    return Math.round((used / disk.total) * 100);
  }, [disk]);

  // Ordenar entradas
  const sortedEntries = React.useMemo(() => {
    const sorted = [...entries];
    
    sorted.sort((a, b) => {
      // Primero: carpetas antes que archivos
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      // Segundo: ordenar por el criterio seleccionado dentro de cada grupo
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = (a.size || 0) - (b.size || 0);
      } else if (sortBy === 'type') {
        comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [entries, sortBy, sortOrder]);

  // Determinar si las subidas están permitidas
  const uploadsAllowed = React.useMemo(() => {
    // No permitir subidas en C:\ raíz
    if (disk && disk.mount && disk.mount.toUpperCase() === 'C:\\' && path === '.') {
      return false;
    }
    return true;
  }, [disk, path]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  React.useEffect(()=>{ fetchList(); }, [disk, path]);

  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowNavigator(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function fetchList(){
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching files for disk:', disk.mount, 'path:', path);
      const res = await api.get(`/files?disk=${encodeURIComponent(disk.mount)}&path=${encodeURIComponent(path)}`);
      console.log('Files response:', res);
      setEntries(res.entries || []);
    } catch(e) {
      console.error('Error loading files:', e);
      setError(e.error || e.message || 'Error loading files');
    }
    setLoading(false);
  }

  function navigateToFolder(folderName) {
    const newPath = path === '.' ? folderName : `${path}/${folderName}`;
    setPath(newPath);
  }

  function navigateUp() {
    if (path === '.') return;
    const parts = path.split('/');
    parts.pop();
    setPath(parts.length === 0 ? '.' : parts.join('/'));
  }

  function getBreadcrumbs() {
    if (path === '.') return [];
    return path.split('/');
  }

  async function handleDelete(entry) {
    try {
      const targetPath = path === '.' ? entry.name : `${path}/${entry.name}`;
      await api.post('/files/delete', { disk: disk.mount, path: targetPath });
      fetchList();
    } catch(e) {
      const errorMsg = e.response?.data?.error || t('error.delete_failed');
      alert(errorMsg);
    }
  }

  async function handleRename(entry, newName) {
    const oldPath = path === '.' ? entry.name : `${path}/${entry.name}`;
    const newPath = path === '.' ? newName : `${path}/${newName}`;
    try {
      await api.post('/files/rename', { disk: disk.mount, oldPath, newPath });
      fetchList();
    } catch(e) {
      alert(t('error.rename_failed'));
    }
  }

  async function handleDownload(entry) {
    const filePath = path === '.' ? entry.name : `${path}/${entry.name}`;
    const url = `http://79.116.36.78:4000/api/files/download?disk=${encodeURIComponent(disk.mount)}&path=${encodeURIComponent(filePath)}`;
    window.open(url, '_blank');
  }

  async function createFolder(folderName) {
    const targetPath = path === '.' ? folderName : `${path}/${folderName}`;
    try {
      await api.post('/files/mkdir', { disk: disk.mount, path: targetPath });
      setShowNewFolder(false);
      fetchList();
    } catch(e) {
      alert(t('error.mkdir_failed'));
    }
  }

  return (
    <div>
      <div className="explorer-header">
        <h3>{disk.mount}</h3>
        <div className="toolbar">
          <button onClick={() => setShowNavigator(true)} className="navigator-btn" title="Ctrl+K">
            🔍 {t('navigator.quick_nav')}
          </button>
          <button onClick={() => setShowNewFolder(true)}>{t('file.new_folder')}</button>
          {/* <button onClick={fetchList} className="secondary small">{t('file.refresh')}</button> */}
        </div>
      </div>

      {path !== '.' && (
        <div className="breadcrumb">
          <button onClick={() => setPath('.')}>🏠 {t('file.root')}</button>
          {getBreadcrumbs().map((part, i) => (
            <React.Fragment key={i}>
              <span>/</span>
              <button onClick={() => setPath(getBreadcrumbs().slice(0, i+1).join('/'))}>{part}</button>
            </React.Fragment>
          ))}
          <button onClick={navigateUp} className="small secondary">⬆️ {t('file.back')}</button>
        </div>
      )}

      <DiskSpace disk={disk} />

      {diskUsagePercent >= 95 && (
        <div className="disk-warning critical" style={{ 
          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
          fontWeight: 600
        }}>
          ⚠️ {t('error.disk_full')}
        </div>
      )}

      {diskUsagePercent >= 90 && diskUsagePercent < 95 && (
        <div className="disk-warning high" style={{ 
          background: 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)',
          color: 'white',
          padding: '14px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(230, 126, 34, 0.3)'
        }}>
          ⚠️ Advertencia: El disco está al {diskUsagePercent}% de capacidad. Acercándose al límite de seguridad (95%).
        </div>
      )}

      <UploadForm disk={disk.mount} path={path} onUploaded={fetchList} uploadsAllowed={uploadsAllowed} />

      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <div style={{padding: 20, textAlign: 'center'}}>{t('file.loading')}</div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <h3>{t('file.empty_folder')}</h3>
          <p>{t('file.upload_or_create')}</p>
        </div>
      ) : (
        <>
          <div className="file-list">
            {sortedEntries.map((e,i)=>{
              // Carpetas por defecto de C:\ no se pueden editar
              const ALLOWED_C_FOLDERS = ['Desktop', 'Escritorio', 'Documents', 'Documentos', 'Downloads', 'Descargas', 'Pictures', 'Imágenes', 'Videos', 'Music', 'Música', 'Contacts', 'Contactos', '3D Objects'];
              const isDefaultCFolder = disk && disk.mount && disk.mount.toUpperCase() === 'C:\\' && path === '.' && ALLOWED_C_FOLDERS.includes(e.name);
              
              return (
                <FileRow 
                  key={i} 
                  entry={e} 
                  onNavigate={e.isDirectory ? () => navigateToFolder(e.name) : null}
                  onDelete={() => handleDelete(e)}
                  onRename={(newName) => handleRename(e, newName)}
                  onDownload={() => handleDownload(e)}
                  isEditable={!isDefaultCFolder}
                />
              );
            })}
          </div>
        </>
      )}

      {showNewFolder && (
        <FolderModal 
          onClose={() => setShowNewFolder(false)}
          onCreate={createFolder}
        />
      )}

      {showNavigator && (
        <QuickNavigator 
          disk={disk.mount}
          onNavigate={(newPath) => setPath(newPath)}
          onClose={() => setShowNavigator(false)}
        />
      )}
    </div>
  )
}
