import React, { useState } from "react";
import PropTypes from "prop-types";
import { API_KEY_MIN_LENGTH } from "../constants";
import "./apiKeySetup.css";

// TODO: Add a "test API key" button that validates the key before saving

function ApiKeySetup({ onApiKeySet, onCancel, existingKey }) {
  const [apiKey, setApiKey] = useState(existingKey || "");
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const validateApiKey = (key) => {
    // Basic validation: Google API keys typically start with "AIza" and are 39 characters
    const trimmedKey = key.trim();

    if (!trimmedKey) {
      return "API key cannot be empty";
    }

    if (trimmedKey.length < API_KEY_MIN_LENGTH) {
      return "API key seems too short. Please check and try again.";
    }

    if (!/^[A-Za-z0-9_-]+$/.test(trimmedKey)) {
      return "API key contains invalid characters";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate the API key format
    const validationError = validateApiKey(apiKey);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsValidating(true);

    try {
      // Store API key in localStorage
      const trimmedKey = apiKey.trim();
      localStorage.setItem("googleMapsApiKey", trimmedKey);

      // Small delay to show feedback
      setTimeout(() => {
        onApiKeySet(trimmedKey);
      }, 500);
    } catch (err) {
      setError("Failed to save API key. Please try again.");
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear your API key? You'll need to enter a new one.")) {
      localStorage.removeItem("googleMapsApiKey");
      setApiKey("");
      if (onCancel) {
        onCancel(); // This will trigger re-render to show setup page without existing key
      }
    }
  };

  return (
    <div className="api-setup-container">
      <div className="api-setup-wrapper">
        <div className="logo-section">
          <img
            src={process.env.PUBLIC_URL + "home.png"}
            className="setup-logo"
            alt="logo"
          />
          <h1>PRAELOCATE</h1>
          <h2>{existingKey ? "Change API Key" : "Setup Required"}</h2>
        </div>

        <div className="setup-content">
          <p className="setup-description">
            To use Praelocate, you need to provide your own Google Maps API key.
            This allows the application to access Google Maps services.
          </p>

          <form onSubmit={handleSubmit} className="api-form">
            <div className="form-group">
              <label htmlFor="apiKey">Google Maps API Key:</label>
              <input
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(""); // Clear error on input change
                }}
                placeholder="Enter your API key here"
                className={`api-input ${error ? "error" : ""}`}
                required
                disabled={isValidating}
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="button-group">
              <button
                type="submit"
                className="submit-button"
                disabled={isValidating || !apiKey.trim()}
              >
                {isValidating ? "Validating..." : existingKey ? "Update" : "Continue"}
              </button>
              {onCancel && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onCancel}
                  disabled={isValidating}
                >
                  Cancel
                </button>
              )}
            </div>
            {existingKey && (
              <button
                type="button"
                className="reset-button"
                onClick={handleReset}
                disabled={isValidating}
              >
                Clear API Key
              </button>
            )}
          </form>

          <div className="instructions-section">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="toggle-instructions"
            >
              {showInstructions ? "Hide" : "Show"} Instructions
            </button>

            {showInstructions && (
              <div className="instructions-content">
                <h3>How to get a Google Maps API Key:</h3>
                <ol>
                  <li>
                    Go to the{" "}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Create a new project or select an existing one</li>
                  <li>Enable the following APIs:
                    <ul>
                      <li>Maps JavaScript API</li>
                      <li>Geocoding API</li>
                      <li>Places API</li>
                      <li>Distance Matrix API</li>
                    </ul>
                  </li>
                  <li>Go to "Credentials" and create an API key</li>
                  <li>Copy the API key and paste it above</li>
                </ol>
                <p className="note">
                  <strong>Note:</strong> Your API key is stored locally in your
                  browser and is never sent to any server except Google's APIs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

ApiKeySetup.propTypes = {
  onApiKeySet: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  existingKey: PropTypes.string,
};

ApiKeySetup.defaultProps = {
  onCancel: null,
  existingKey: null,
};

export default ApiKeySetup;
