import React, { useRef, useState, useEffect } from "react";
import Map from "./components/Map";
import ApiKeySetup from "./components/ApiKeySetup";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "./components/Toast";
import useToast from "./hooks/useToast";
import "./App.css";

function App() {
  const ref = useRef();
  const [apiKey, setApiKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("light");
  const toast = useToast();

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Check if API key exists in localStorage on mount
    const storedApiKey = localStorage.getItem("googleMapsApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    setIsLoading(false);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const handleClick = () => {
    ref.current.style.opacity = 1;
  };

  const handleApiKeySet = (key) => {
    setApiKey(key);
    setShowSettings(false);
    toast.success("API key saved successfully!");
  };

  const handleResetApiKey = () => {
    localStorage.removeItem("googleMapsApiKey");
    setApiKey(null);
    setShowSettings(false);
    toast.info("API key has been reset");
  };

  // Show loading state briefly while checking localStorage
  if (isLoading) {
    return (
      <div className="App app-loading">
        <div className="app-loading-spinner" aria-label="Loading..." />
      </div>
    );
  }

  // Show setup page if no API key or if settings is open
  if (!apiKey || showSettings) {
    return (
      <ErrorBoundary>
        <ApiKeySetup
          onApiKeySet={handleApiKeySet}
          onCancel={
            apiKey && showSettings ? () => setShowSettings(false) : null
          }
          existingKey={showSettings ? apiKey : null}
          onReset={showSettings ? handleResetApiKey : null}
        />
        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      </ErrorBoundary>
    );
  }

  // Show main app once API key is set
  return (
    <ErrorBoundary>
      <div className="App">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <button
          className="settings-button"
          onClick={() => setShowSettings(true)}
          title="Change API Key"
          aria-label="Settings"
        >
          ⚙
        </button>

        <div className="header" onClick={handleClick}>
          <div className="header wrapper" ref={ref}>
            <div className="logo">
              <img
                src={process.env.PUBLIC_URL + "home.png"}
                className="App-logo"
                alt="Praelocate logo"
              />
              <h1>PRAELOCATE</h1>
            </div>
            <h2>A home location tool</h2>
            <p>
              Your quest to find your dream home just became one step closer.
            </p>
            <a className="fakeButton" href="#body">
              Start
            </a>
          </div>
        </div>

        <div id="body" className="body">
          <Map apiKey={apiKey} toast={toast} />
        </div>

        <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      </div>
    </ErrorBoundary>
  );
}

export default App;
