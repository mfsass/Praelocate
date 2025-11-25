import React, { useRef, useState, useEffect } from "react";
import Map from "./components/Map";
import ApiKeySetup from "./components/ApiKeySetup";
import "./App.css";

// TODO: Add a settings icon to allow users to change API key later
// TODO: Improve the transition between setup and main app
// TODO: Add error boundary for better error handling
// TODO: Consider adding a splash screen/loading animation
// TODO: Implement proper state management (Context API or Redux) for larger scale

function App() {
  const ref = useRef();
  const [apiKey, setApiKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if API key exists in localStorage on mount
    const storedApiKey = localStorage.getItem("googleMapsApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    setIsLoading(false);
  }, []);

  const handleClick = () => {
    ref.current.style.opacity = 1;
  };

  const handleApiKeySet = (key) => {
    setApiKey(key);
  };

  // Show loading state briefly while checking localStorage
  if (isLoading) {
    return <div className="App">Loading...</div>;
  }

  // Show setup page if no API key
  if (!apiKey) {
    return <ApiKeySetup onApiKeySet={handleApiKeySet} />;
  }

  // Show main app once API key is set
  return (
    <div className="App">
      <div className="header" onClick={handleClick}>
        <div className="header wrapper" ref={ref}>
          <div className="logo">
            <img
              src={process.env.PUBLIC_URL + "home.png"}
              className="App-logo"
              alt="logo"
            />
            <h1>PRAELOCATE</h1>
          </div>
          <h2>A home location tool</h2>
          <p>Your quest to find your dream home just became one step closer.</p>
          <a className="fakeButton" href="#body">
            Start
          </a>
        </div>
      </div>

      <div id="body" className="body">
        <Map apiKey={apiKey} />
      </div>
    </div>
  );
}

export default App;
