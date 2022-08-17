import "./App.css";
import home from "./home-alt.svg";
import React from 'react'
import Locations from "./components/Locations";
import { GoogleMap, LoadScript } from '@react-google-maps/api';

const containerStyle = {
  width: '400px',
  height: '400px'
};

const center = {
  lat: -3.745,
  lng: -38.523
};

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
        <LoadScript googleMapsApiKey="AIzaSyAw71uaQ28Y-SABJAkLueUlhtdcN1JAPzI">
          <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10}
          >
          <></>
          </GoogleMap>
        </LoadScript>
        <Locations></Locations>
      </body>
    </div>
  );
}

export default App;
