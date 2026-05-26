import { useEffect, useCallback } from 'react';

/**
 * Modal reutilizable con backdrop blur y animación.
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {string} title
 * @param {ReactNode} children
 * @param {ReactNode} footer — botones de acción
 * @param {string} size — 'sm' | 'md' (default) | 'lg'
 */
export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  // Cerrar con Escape
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKey]);

  if (!isOpen) return null;

  const maxWidths = { sm: '380px', md: '520px', lg: '720px' };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-box" style={{ maxWidth: maxWidths[size] }}>
        <div className="modal-header">
          <h3 className="modal-title" id="modal-title">
            {title}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
