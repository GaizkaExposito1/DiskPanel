import React from 'react'
import { useTranslation } from 'react-i18next'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './styles.css'

export default function App() {
  const { t } = useTranslation();
  const [token, setToken] = React.useState(localStorage.getItem('token'));

  if (!token) return <Login onLogin={(tok) => { setToken(tok); localStorage.setItem('token', tok); }} />

  return <Dashboard token={token} onLogout={() => { localStorage.removeItem('token'); setToken(null); }}>{t('app.title')}</Dashboard>
}
