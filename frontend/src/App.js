import React from "react";
import Map from "./components/Map";
import "./App.css";

const location = {
  address: "1600 Amphitheatre Parkway, Mountain View, california.",
  lat: 37.42216,
  lng: -122.08427,
};

function App() {
  return (
    <div className="App">
      <div className="header">
        <h1>Praelocate</h1>
        <i>
          <h3>A home location tool</h3>
        </i>
        <p>Your quest to find your dream home just became one step closer.</p>
        <p>Enter your important locations below.</p>
        <img
          src={process.env.PUBLIC_URL + "home.png"}
          className="App-logo"
          alt="logo"
        />
        <a href="#body">Start</a>
      </div>
      <div id="body" className="body">
        <Map location={location} />
      </div>
    </div>
  );
}

export default App;
