import React, { useState } from "react";
import "./apiKeySetup.css";

// TODO: Add better validation for API key format
// TODO: Add a "test API key" button that validates the key before saving
// TODO: Add a link to Google Cloud Console for getting an API key
// TODO: Implement error handling for invalid API keys
// TODO: Add visual feedback for successful API key storage
// TODO: Consider adding a way to clear/reset the API key from settings

function ApiKeySetup({ onApiKeySet }) {
  const [apiKey, setApiKey] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (apiKey.trim()) {
      // Store API key in localStorage
      localStorage.setItem("googleMapsApiKey", apiKey.trim());
      onApiKeySet(apiKey.trim());
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
          <h2>Setup Required</h2>
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
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key here"
                className="api-input"
                required
              />
            </div>

            <button type="submit" className="submit-button">
              Continue
            </button>
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

export default ApiKeySetup;
