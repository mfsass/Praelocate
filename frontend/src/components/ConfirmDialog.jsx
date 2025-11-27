import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./ConfirmDialog.css";

/**
 * Confirmation Dialog Component
 * A reusable modal for confirming destructive actions.
 */
const ConfirmDialog = ({
  isOpen,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // danger, warning, info
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Focus management and escape key
  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button when dialog opens
      confirmBtnRef.current?.focus();

      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          onCancel?.();
        }
      };

      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const icons = {
    danger: "🗑️",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div
      className="dialog-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className={`dialog-content dialog-${variant}`}
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
      >
        <div className="dialog-icon">{icons[variant]}</div>
        <h2 id="dialog-title" className="dialog-title">
          {title}
        </h2>
        <p className="dialog-message">{message}</p>

        <div className="dialog-actions">
          <button className="dialog-btn dialog-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`dialog-btn dialog-btn-confirm dialog-btn-${variant}`}
            onClick={onConfirm}
            ref={confirmBtnRef}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  variant: PropTypes.oneOf(["danger", "warning", "info"]),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmDialog;
