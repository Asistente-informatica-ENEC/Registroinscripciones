export default function Modal({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  if (!open) return null

  const isConfirm = !!onConfirm

  return (
    <div className="modal-overlay" onClick={isConfirm ? onCancel : undefined}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          {isConfirm && (
            <button className="btn-modal btn-modal-cancel" onClick={onCancel}>
              Cancelar
            </button>
          )}
          <button
            className={`btn-modal ${isConfirm ? 'btn-modal-confirm' : 'btn-modal-ok'}`}
            onClick={isConfirm ? onConfirm : onCancel}
          >
            {confirmLabel || (isConfirm ? 'Confirmar' : 'Aceptar')}
          </button>
        </div>
      </div>
    </div>
  )
}
