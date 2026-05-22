function ConfirmModal({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="confirm-title"
        className="details-modal"
        role="dialog"
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Confirmação</p>
            <h2 id="confirm-title">{title}</h2>
          </div>
        </header>

        <p>{message}</p>

        <div className="confirm-actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button className="primary-button" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmModal;
