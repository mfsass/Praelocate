import React from "react";
import PropTypes from "prop-types";
import "./EmptyState.css";

/**
 * Empty State Component
 * Displays a helpful message when there's no content to show.
 */
const EmptyState = ({
  icon = "📍",
  title,
  description,
  action,
  actionLabel = "Get Started",
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <button className="empty-state-action" onClick={action}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.func,
  actionLabel: PropTypes.string,
};

export default EmptyState;
