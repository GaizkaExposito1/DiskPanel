import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher(){
  const { i18n } = useTranslation();
  const lang = i18n.language || 'es';
  
  function setLang(l){ 
    i18n.changeLanguage(l); 
    localStorage.setItem('i18nextLng', l); 
  }

  const languages = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇬🇧' }
  ];

  const currentLang = languages.find(l => l.code === lang);

  return (
    <div className="language-switcher">
      <select 
        value={lang} 
        onChange={(e) => setLang(e.target.value)}
        className="language-select"
      >
        {languages.map(language => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.label}
          </option>
        ))}
      </select>
    </div>
  )
}
