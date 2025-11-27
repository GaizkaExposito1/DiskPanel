import React from 'react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'

export default function DiskList({ onSelect, selected, onDisksLoaded, onRefreshIntervalLoaded, refreshKey }) {
  const { t } = useTranslation();
  const [disks, setDisks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(true);

  React.useEffect(()=>{ fetchDisks(); }, [refreshKey]);

  async function fetchDisks(){
    setLoading(true);
    try {
      const res = await api.get('/disks');
      const diskData = res.disks || [];
      const refreshInterval = res.refreshInterval;
      
      setDisks(diskData);
      if (onDisksLoaded) {
        onDisksLoaded(diskData);
      }
      if (onRefreshIntervalLoaded && refreshInterval) {
        onRefreshIntervalLoaded(refreshInterval);
      }
    } catch(e) {
      console.error('Error loading disks:', e);
    }
    setLoading(false);
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div>
      <div className="disk-list-header">
        <h4>{t('disks.title')}</h4>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="toggle-btn"
          title={isExpanded ? t('disks.collapse') : t('disks.expand')}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          {loading ? (
            <div style={{padding: 10, textAlign: 'center', color: '#999'}}>
              {t('disks.loading')}
            </div>
          ) : disks.length === 0 ? (
            <div style={{padding: 10, textAlign: 'center', color: '#999'}}>
              {t('disks.no_disks')}
            </div>
          ) : (
            <ul>
              {disks.map((d,i)=> (
                <li key={i}>
                  <button 
                    onClick={()=>onSelect(d)}
                    style={{
                      background: selected?.mount === d.mount ? '#667eea' : '#f8f9fa',
                      color: selected?.mount === d.mount ? 'white' : '#333',
                      borderColor: selected?.mount === d.mount ? '#667eea' : '#e0e0e0'
                    }}
                  >
                    <div style={{fontWeight: 600, marginBottom: 4}}>
                      {d.mount || d.id}
                    </div>
                    {d.total > 0 && (
                      <div style={{fontSize: 11, opacity: 0.8}}>
                        {formatBytes(d.total)}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

    </div>
  )
}
