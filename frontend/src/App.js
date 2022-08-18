import "./App.css";
import home from "./home-alt.svg";
import React from 'react'
import Locations from "./components/Locations";
import MapSection from './components/map'

const location = {
  address: '1600 Amphitheatre Parkway, Mountain View, california.',
  lat: 37.42216,
  lng: -122.08427,
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Home Location Tool</h1>
        <p>
          Enter your important locations and see where your dream home might be
        </p>
      </header>
      <body>
        <img src={home} className="App-logo" alt="logo" />
        <MapSection location={location}/>
        <Locations></Locations>
      </body>
    </div>
  );
}

export default App;
