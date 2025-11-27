import React from 'react'
import { useTranslation } from 'react-i18next'

export default function FolderModal({ onClose, onCreate }) {
  const { t } = useTranslation();
  const [folderName, setFolderName] = React.useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{t('file.new_folder')}</h3>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder={t('file.folder_name')}
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary">
              {t('file.cancel')}
            </button>
            <button type="submit" disabled={!folderName.trim()}>
              {t('file.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
