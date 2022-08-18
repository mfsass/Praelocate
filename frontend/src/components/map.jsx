import React from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import './map.css';

const containerStyle = {
    width: '400px',
    height: '400px'
};
  
const center = {
    lat: -33.9328,
    lng: 18.8644
};
  

let Map = () => (
    <div className="map">
        <div className="google-map">
        <LoadScript googleMapsApiKey="AIzaSyAw71uaQ28Y-SABJAkLueUlhtdcN1JAPzI">
            <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            >
            </GoogleMap>
        </LoadScript>
        </div>
    </div>
)

export default Map