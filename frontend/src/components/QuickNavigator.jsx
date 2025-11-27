import React from 'react'
import { useTranslation } from 'react-i18next'

export default function QuickNavigator({ disk, onNavigate, onClose }) {
  const { t } = useTranslation();
  const [path, setPath] = React.useState('');
  const inputRef = React.useRef();

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (path.trim()) {
      onNavigate(path.trim());
      onClose();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quick-navigator" onClick={e => e.stopPropagation()}>
        <h3>🔍 {t('navigator.title')}</h3>
        <p className="navigator-hint">{t('navigator.hint')}</p>
        <form onSubmit={handleSubmit}>
          <div className="navigator-input-group">
            <span className="navigator-prefix">{disk}:</span>
            <input 
              ref={inputRef}
              type="text" 
              placeholder={t('navigator.placeholder')}
              value={path}
              onChange={e => setPath(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>
          <div className="navigator-examples">
            <span>{t('navigator.examples')}:</span>
            <button type="button" onClick={() => setPath('.')} className="example-btn">.</button>
            <button type="button" onClick={() => setPath('DashboardApp')} className="example-btn">DashboardApp</button>
            <button type="button" onClick={() => setPath('Documents/Projects')} className="example-btn">Documents/Projects</button>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary">
              {t('file.cancel')}
            </button>
            <button type="submit" disabled={!path.trim()}>
              {t('navigator.go')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
