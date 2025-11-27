import axios from 'axios'
import i18n from '../i18n'

const baseURL = 'http://79.116.36.78:4000/api';

const instance = axios.create({ 
  baseURL, 
  headers: { 'Accept-Language': i18n.language || 'es' } 
});

// Update language header when language changes
i18n.on('languageChanged', (lng) => {
  instance.defaults.headers['Accept-Language'] = lng;
});

export default {
  async get(path) { 
    try {
      const r = await instance.get(path); 
      return r.data;
    } catch(e) {
      throw e.response?.data || e;
    }
  },
  async post(path, body) { 
    try {
      const r = await instance.post(path, body); 
      return r.data;
    } catch(e) {
      throw e.response?.data || e;
    }
  },
  async postForm(path, form) { 
    try {
      const r = await instance.post(path, form, { 
        headers: { 
          'Content-Type': 'multipart/form-data', 
          'Accept-Language': i18n.language 
        } 
      }); 
      return r.data;
    } catch(e) {
      throw e.response?.data || e;
    }
  }
}
