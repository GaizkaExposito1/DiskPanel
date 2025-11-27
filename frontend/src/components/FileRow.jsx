import React from 'react'
import { useTranslation } from 'react-i18next'

// Función para formatear bytes a formato legible
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function FileRow({ entry, onNavigate, onDelete, onRename, onDownload, isEditable = true }) {
  const { t } = useTranslation();
  const [editing, setEditing] = React.useState(false);
  const [newName, setNewName] = React.useState(entry.name);

  function handleRename() {
    if (newName && newName !== entry.name) {
      onRename(newName);
    }
    setEditing(false);
  }

  return (
    <div className="file-row">
      <div className="file-icon">
        {entry.isDirectory ? '📁' : '📄'}
      </div>
      
      {editing ? (
        <input 
          type="text" 
          value={newName} 
          onChange={e => setNewName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={e => e.key === 'Enter' && handleRename()}
          autoFocus
          className="file-rename-input"
        />
      ) : (
        <>
          <div 
            className="file-name" 
            onClick={onNavigate}
            style={{ cursor: onNavigate ? 'pointer' : 'default' }}
          >
            {entry.name}
          </div>
          
          <div className="file-size">
            {entry.isDirectory ? '-' : formatBytes(entry.size || 0)}
          </div>
        </>
      )}

      <div className="file-actions">
        {!editing && (
          <>
            {onDownload && (
              <button onClick={onDownload} className="small secondary" title={t('file.download')}>
                ⬇️
              </button>
            )}
            {isEditable && (
              <>
                <button onClick={() => setEditing(true)} className="small secondary" title={t('file.rename')}>
                  ✏️
                </button>
                <button onClick={onDelete} className="small danger" title={t('file.delete')}>
                  🗑️
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
