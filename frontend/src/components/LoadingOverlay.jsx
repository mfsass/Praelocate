import React from "react";
import PropTypes from "prop-types";
import "./LoadingOverlay.css";

/**
 * LoadingOverlay Component
 * A modern, accessible loading overlay with different states and messages.
 */
const LoadingOverlay = ({
  isVisible,
  message = "Loading...",
  type = "spinner",
  subMessage = null,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className="loading-overlay"
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="loading-content">
        {type === "spinner" && (
          <div className="spinner-container">
            <svg className="spinner-svg" viewBox="0 0 50 50" aria-hidden="true">
              <circle
                className="spinner-path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
              />
            </svg>
          </div>
        )}

        {type === "dots" && (
          <div className="dots-container" aria-hidden="true">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}

        {type === "pulse" && (
          <div className="pulse-container" aria-hidden="true">
            <div className="pulse-ring"></div>
            <div className="pulse-core">
              <span className="pulse-icon">📍</span>
            </div>
          </div>
        )}

        {type === "thinking" && (
          <div className="thinking-container" aria-hidden="true">
            <div className="brain-icon">🧠</div>
            <div className="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <p className="loading-message">{message}</p>
        {subMessage && <p className="loading-sub-message">{subMessage}</p>}
      </div>
    </div>
  );
};

LoadingOverlay.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  message: PropTypes.string,
  type: PropTypes.oneOf(["spinner", "dots", "pulse", "thinking"]),
  subMessage: PropTypes.string,
};

export default LoadingOverlay;
