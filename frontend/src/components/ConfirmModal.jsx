import React from 'react'
import { useTranslation } from 'react-i18next'

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="secondary">
            {t('common.cancel')}
          </button>
          <button onClick={onConfirm} className="danger">
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
