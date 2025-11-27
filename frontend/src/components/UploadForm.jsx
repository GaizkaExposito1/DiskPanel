import React from 'react'
import api from '../services/api'
import { useTranslation } from 'react-i18next'

export default function UploadForm({ disk, path, onUploaded, uploadsAllowed = true }){
  const { t } = useTranslation();
  const fileRef = React.useRef();
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [dragActive, setDragActive] = React.useState(false);

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile({
        name: file.name,
        size: file.size,
        formatted: formatBytes(file.size)
      });
      setMessage(null);
    }
  }

  function clearSelectedFile() {
    fileRef.current.value = '';
    setSelectedFile(null);
    setMessage(null);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      fileRef.current.files = e.dataTransfer.files;
      setSelectedFile({
        name: file.name,
        size: file.size,
        formatted: formatBytes(file.size)
      });
      setMessage(null);
    }
  }

  async function submit(e){
    e.preventDefault();
    const file = fileRef.current.files[0];
    if(!file) return;
    
    setUploading(true);
    setMessage(null);
    
    try {
      const form = new FormData();
      form.append('file', file);
      await api.postForm(`/files/upload?disk=${encodeURIComponent(disk)}&path=${encodeURIComponent(path)}`, form);
      setMessage({ type: 'success', text: t('file.upload_success') });
      fileRef.current.value = '';
      setSelectedFile(null);
      if(onUploaded) onUploaded();
    } catch(e) {
      const errorMsg = e.response?.data?.error || t('error.upload_failed');
      // Ocultar error de upload deshabilitado en C:\ raíz
      if (errorMsg.includes('upload_disabled_at_root') || errorMsg.includes('No se permiten subidas')) {
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: errorMsg });
      }
    }
    
    setUploading(false);
  }

  return (
    <>
      {uploadsAllowed && (
        <div className="upload-card">
          <div className="upload-header">
            <h3>{t('file.upload_file')}</h3>
            <p className="upload-subtitle">Sube archivos a esta carpeta</p>
          </div>

          <form onSubmit={submit} className="upload-form-container">
        <div 
          className={`upload-drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileRef} 
            disabled={uploading}
            onChange={handleFileSelect}
            className="file-input-hidden"
            style={{ display: 'none' }}
          />

          {!selectedFile ? (
            <div className="upload-placeholder">
              <div className="upload-icon-large">📁</div>
              <p className="upload-main-text">Arrastra archivos aquí</p>
              <p className="upload-sub-text">o haz clic para seleccionar</p>
            </div>
          ) : (
            <div className="upload-file-preview">
              <div className="file-icon-preview">📄</div>
              <div className="file-info">
                <p className="file-name-preview">{selectedFile.name}</p>
                <p className="file-size-preview">{selectedFile.formatted}</p>
              </div>
              <button 
                type="button"
                onClick={clearSelectedFile}
                className="file-clear-btn"
                title="Quitar archivo"
              >
                ✕
              </button>
              <div className="file-check">✓</div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={uploading || !selectedFile || !uploadsAllowed}
          className="upload-submit-btn"
          title={!uploadsAllowed ? t('error.upload_disabled_at_root') || 'Las subidas no están permitidas en la raíz de C:' : ''}
        >
          {uploading ? (
            <>
              <span className="spinner-mini"></span>
              Subiendo...
            </>
          ) : (
            <>
              ⬆️ Subir archivo
            </>
          )}
        </button>
      </form>

      {message && (
        <div className={`upload-alert ${message.type}`}>
          <span className="alert-icon">{message.type === 'success' ? '✓' : '✕'}</span>
          <span className="alert-text">{message.text}</span>
        </div>
      )}
        </div>
      )}
    </>
  )
}
