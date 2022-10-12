import React, { useRef } from "react";
import Map from "./components/Map";
import "./App.css";

function App() {
  const ref = useRef();

  const handleClick = () => {
    ref.current.style.opacity = 1;
  };

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
        <Map />
      </div>
    </div>
  );
}

export default App;
