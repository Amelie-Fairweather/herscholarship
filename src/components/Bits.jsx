import { wordCount } from '../lib/validate.js';

export function Field({ id, label, hint, error, children }) {
  return (
    <div className={`field ${error ? 'is-invalid' : ''}`}>
      {id ? <label htmlFor={id}>{label}</label> : <p className="label">{label}</p>}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function Count({ value, max, unit = 'words' }) {
  const count = unit === 'words' ? wordCount(value) : String(value || '').length;
  const over = count > max;
  const close = !over && max > 0 && count >= max * 0.85;
  const width = Math.min(100, max ? (count / max) * 100 : 0);
  return (
    <p className={`count ${over ? 'is-over' : ''} ${close ? 'is-close' : ''}`}>
      <span className="count-track" aria-hidden="true">
        <span style={{ width: `${width}%` }} />
      </span>
      <span>
        {count} / {max} {unit}
      </span>
    </p>
  );
}

export function Choice({ pressed, onClick, title, copy, disabled }) {
  return (
    <button
      type="button"
      className={`choice ${pressed ? 'is-picked' : ''}`}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
    >
      <strong>{title}</strong>
      {copy ? <span>{copy}</span> : null}
    </button>
  );
}

export function ConfirmBar({ text, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="confirm-bar">
      <p>{text}</p>
      <div>
        <button type="button" className="btn btn-small btn-primary" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={onCancel}>
          Keep mine
        </button>
      </div>
    </div>
  );
}
