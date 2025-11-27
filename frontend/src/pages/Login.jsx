import React from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login({ onLogin }) {
  const { t } = useTranslation();
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [err, setErr] = React.useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username: user, password: pass });
      if (res.token) onLogin(res.token);
    } catch (e) { setErr(e.message || 'error'); }
  }

  return (
    <div className="login">
      <LanguageSwitcher />
      <h2>{t('login.title')}</h2>
      <form onSubmit={submit}>
        <input placeholder={t('login.username')} value={user} onChange={e=>setUser(e.target.value)} />
        <input type="password" placeholder={t('login.password')} value={pass} onChange={e=>setPass(e.target.value)} />
        <button type="submit">{t('login.submit')}</button>
      </form>
      {err && <div className="error">{err}</div>}
    </div>
  )
}
