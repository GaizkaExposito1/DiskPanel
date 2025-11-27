import React from 'react'
import { useTranslation } from 'react-i18next'

export default function DiskSpace({ disk }) {
  const { t } = useTranslation();

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function getUsageColor(percent) {
    if (percent >= 90) return '#e74c3c'; // Rojo
    if (percent >= 80) return '#e67e22'; // Naranja  
    if (percent >= 60) return '#f39c12'; // Amarillo
    return '#3498db'; // Azul normal
  }

  function getUsageGradient(percent) {
    if (percent >= 90) return 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)'; // Rojo
    if (percent >= 80) return 'linear-gradient(90deg, #e67e22 0%, #d35400 100%)'; // Naranja
    if (percent >= 60) return 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)'; // Amarillo-Naranja
    return 'linear-gradient(90deg, #3498db 0%, #2980b9 100%)'; // Azul normal
  }

  const total = disk.total || 0;
  const free = disk.free || 0;
  const used = total - free;
  const usedPercent = total > 0 ? Math.round((used / total) * 100) : 0;
  const fillColor = getUsageColor(usedPercent);
  const fillGradient = getUsageGradient(usedPercent);

  return (
    <div className="disk-space">
      <h4>{t('disk.storage')}</h4>
      <div className="space-info">
        <div className="space-bar">
          <div 
            className="space-bar-fill" 
            style={{ width: `${usedPercent}%`, background: fillGradient }}
            title={`${usedPercent}% usado`}
          />
        </div>
        <div className="space-stats">
          <div className="stat">
            <span className="stat-label">{t('disk.used')}:</span>
            <span className="stat-value" style={{ color: fillColor, fontWeight: 600 }}>
              {formatBytes(used)} ({usedPercent}%)
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('disk.free')}:</span>
            <span className="stat-value">{formatBytes(free)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('disk.total')}:</span>
            <span className="stat-value">{formatBytes(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
