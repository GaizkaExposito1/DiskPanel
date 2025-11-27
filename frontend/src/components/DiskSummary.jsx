import React from 'react'
import { useTranslation } from 'react-i18next'

export default function DiskSummary({ disks, refreshInterval, onDiskClick }) {
  const { t } = useTranslation();
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  React.useEffect(() => {
    setLastUpdate(new Date());
  }, [disks]);

  // Calcular totales - DEBE estar antes de cualquier return condicional
  const totals = React.useMemo(() => {
    if (!disks || disks.length === 0) {
      return { total: 0, used: 0, free: 0, percentage: 0 };
    }
    const total = disks.reduce((sum, d) => sum + (d.total || d.size || 0), 0);
    const free = disks.reduce((sum, d) => sum + (d.free || 0), 0);
    const used = total - free;
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

    return { total, used, free, percentage };
  }, [disks]);

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 GB';
    const gb = bytes / (1024 ** 3);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 ** 2);
    return `${mb.toFixed(2)} MB`;
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
    if (percent >= 60) return 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)'; // Amarillo
    return 'linear-gradient(90deg, #3498db 0%, #2980b9 100%)'; // Azul normal
  }

  // Calcular ángulos para el gráfico de anillo
  const circumference = 2 * Math.PI * 70; // radio = 70
  const usedStroke = (totals.percentage / 100) * circumference;
  const freeStroke = circumference - usedStroke;
  
  // Color del gráfico según porcentaje
  const chartColor = getUsageColor(totals.percentage);
  const chartGradientId = `gradient-${totals.percentage}`;
  const chartGradient = getUsageGradient(totals.percentage);

  // Mostrar estado de carga si no hay discos aún
  if (!disks) {
    return (
      <div className="disk-summary">
        <div style={{textAlign: 'center', padding: '50px', color: '#999'}}>
          <h3>{t('disks.loading')}</h3>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay discos
  if (disks.length === 0) {
    return (
      <div className="disk-summary">
        <div className="empty-state">
          <h3>{t('disks.no_disks')}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="disk-summary">
      <div className="summary-header">
        <h2>📊 {t('summary.title')}</h2>
        {refreshInterval && (
          <div className="auto-refresh-info">
            <span className="refresh-dot"></span>
            <span>{t('summary.auto_refresh')}: {refreshInterval / 1000}s</span>
            <span className="last-update">
              {t('summary.last_update')}: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
      
      <div className="summary-grid">
        {/* Gráfico de anillo */}
        <div className="donut-chart-container">
          <svg className="donut-chart" viewBox="0 0 160 160">
            {/* Fondo */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="20"
            />
            {/* Progreso usado */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={chartColor}
              strokeWidth="20"
              strokeDasharray={`${usedStroke} ${freeStroke}`}
              strokeDashoffset={circumference / 4}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
            {/* Texto central */}
            <text
              x="80"
              y="75"
              textAnchor="middle"
              fontSize="28"
              fontWeight="bold"
              fill={chartColor}
            >
              {totals.percentage}%
            </text>
            <text
              x="80"
              y="95"
              textAnchor="middle"
              fontSize="12"
              fill="#666"
            >
              {t('summary.used')}
            </text>
          </svg>
        </div>

        {/* Estadísticas globales */}
        <div className="global-stats">
          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-info">
              <div className="stat-label">{t('summary.total_capacity')}</div>
              <div className="stat-value">{formatBytes(totals.total)}</div>
            </div>
          </div>

          <div className="stat-card used">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <div className="stat-label">{t('summary.used_space')}</div>
              <div className="stat-value">{formatBytes(totals.used)}</div>
            </div>
          </div>

          <div className="stat-card free">
            <div className="stat-icon">✨</div>
            <div className="stat-info">
              <div className="stat-label">{t('summary.free_space')}</div>
              <div className="stat-value">{formatBytes(totals.free)}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💿</div>
            <div className="stat-info">
              <div className="stat-label">{t('summary.disk_count')}</div>
              <div className="stat-value">{disks?.length || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de discos con barras */}
      <div className="disks-overview">
        <h3>{t('summary.disk_details')}</h3>
        <div className="disk-bars">
          {disks && disks.map((disk, i) => {
            const diskSize = disk.total || disk.size || 0;
            const diskUsed = disk.used || (diskSize - disk.free);
            const diskPercent = diskSize > 0 ? Math.round((diskUsed / diskSize) * 100) : 0;
            const barColor = getUsageGradient(diskPercent);
            
            return (
              <div 
                key={i} 
                className="disk-bar-item clickable"
                onClick={() => onDiskClick && onDiskClick(disk)}
                title={t('summary.click_to_explore')}
              >
                <div className="disk-bar-header">
                  <span className="disk-name">
                    <strong>{disk.mount}</strong> {disk.description || disk.filesystem}
                  </span>
                  <span className="disk-percent" style={{ color: getUsageColor(diskPercent), fontWeight: 600 }}>
                    {diskPercent}% {t('summary.used')}
                  </span>
                </div>
                <div className="disk-bar-progress">
                  <div 
                    className="disk-bar-fill" 
                    style={{ 
                      width: `${diskPercent}%`,
                      background: barColor
                    }}
                  />
                </div>
                <div className="disk-bar-info">
                  <span>{formatBytes(diskUsed)} {t('summary.used')}</span>
                  <span>{formatBytes(disk.free)} {t('summary.free')}</span>
                  <span>{formatBytes(diskSize)} {t('summary.total')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
