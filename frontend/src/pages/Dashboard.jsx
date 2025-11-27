import React from 'react'
import { useTranslation } from 'react-i18next'
import Explorer from './Explorer'
import LanguageSwitcher from '../components/LanguageSwitcher'
import DiskSummary from '../components/DiskSummary'

export default function Dashboard({ token, onLogout }) {
  const { t } = useTranslation();
  const [selectedDisk, setSelectedDisk] = React.useState(null);
  const [disks, setDisks] = React.useState([]);
  const [refreshInterval, setRefreshInterval] = React.useState(60000); // default 1 minuto
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Cargar discos directamente en el Dashboard
  React.useEffect(() => {
    const fetchDisks = async () => {
      try {
        const response = await fetch('http://79.116.36.78:4000/api/disks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDisks(data.disks || []);
          if (data.refreshInterval) {
            setRefreshInterval(data.refreshInterval);
          }
        }
      } catch (error) {
        console.error('Error loading disks:', error);
      }
    };

    fetchDisks();
  }, [token, refreshKey]);

  // Auto-refresh cuando no hay disco seleccionado (estamos en el dashboard principal)
  React.useEffect(() => {
    if (!selectedDisk && refreshInterval > 0) {
      console.log(`Auto-refresh configurado cada ${refreshInterval / 1000} segundos`);
      const timer = setInterval(() => {
        console.log('Auto-refreshing dashboard...');
        setRefreshKey(prev => prev + 1); // Forzar recarga
      }, refreshInterval);

      return () => clearInterval(timer);
    }
  }, [selectedDisk, refreshInterval]);

  return (
    <div>
      <header>
        <h1 
          onClick={() => setSelectedDisk(null)} 
          style={{ cursor: 'pointer' }}
          title={t('dashboard.go_home')}
        >
          {t('app.title')}
        </h1>
        <div className="header-right">
          <LanguageSwitcher />
          <button onClick={onLogout} className="secondary">{t('auth.logout')}</button>
        </div>
      </header>
      <main>
        <section>
          {selectedDisk ? (
            <Explorer disk={selectedDisk} token={token} />
          ) : (
            <DiskSummary 
              disks={disks} 
              refreshInterval={refreshInterval}
              onDiskClick={setSelectedDisk}
            />
          )}
        </section>
      </main>
    </div>
  )
}
