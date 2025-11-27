import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./SettingsPanel.css";

const REGIONS = [
  { code: "za", name: "South Africa", flag: "🇿🇦" },
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "de", name: "Germany", flag: "🇩🇪" },
  { code: "fr", name: "France", flag: "🇫🇷" },
  { code: "nl", name: "Netherlands", flag: "🇳🇱" },
  { code: "nz", name: "New Zealand", flag: "🇳🇿" },
  { code: "in", name: "India", flag: "🇮🇳" },
];

/**
 * SettingsPanel Component
 * Allows users to configure app settings like region/country for address search.
 */
const SettingsPanel = ({ isOpen, onClose, region, onRegionChange }) => {
  const [selectedRegion, setSelectedRegion] = useState(region || "za");

  // Sync with external region prop
  useEffect(() => {
    if (region) {
      setSelectedRegion(region);
    }
  }, [region]);

  const handleSave = () => {
    onRegionChange(selectedRegion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>
            <span className="settings-icon">⚙️</span>
            Settings
          </h2>
          <button
            className="settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>
              <span className="section-icon">🌍</span>
              Region / Country
            </h3>
            <p className="settings-description">
              Select your region to improve address search accuracy. Addresses
              will be prioritized for this location.
            </p>

            <div className="region-grid">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  className={`region-option ${
                    selectedRegion === r.code ? "selected" : ""
                  }`}
                  onClick={() => setSelectedRegion(r.code)}
                  aria-pressed={selectedRegion === r.code}
                >
                  <span className="region-flag">{r.flag}</span>
                  <span className="region-name">{r.name}</span>
                  {selectedRegion === r.code && (
                    <span className="region-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3>
              <span className="section-icon">📍</span>
              Location Detection
            </h3>
            <p className="settings-description">
              Your browser's location detection helps us set the default region
              and center the map on your area. If detection fails, we'll use the
              region selected above.
            </p>
            <div className="settings-info">
              <span className="info-icon">ℹ️</span>
              <span>
                Current region:{" "}
                <strong>
                  {REGIONS.find((r) => r.code === selectedRegion)?.name ||
                    "Unknown"}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-action-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="settings-action-btn primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

SettingsPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  region: PropTypes.string.isRequired,
  onRegionChange: PropTypes.func.isRequired,
};

export default SettingsPanel;
