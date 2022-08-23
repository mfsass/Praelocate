import { React } from "react";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";
import "./map.css";
import { coordinates } from "./Locations.jsx";

const allCoordinates = [];

var info = [];
const requestOpt = {
  method: "GET",
  headers: { "Content-Type": "application/json" },
};
async function fetchFunc() {
  return await fetch("/getLocations", requestOpt)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}
(async () => {
  info = await fetchFunc();
  allCoordinates.push(info);
})();

const handle = (e) => {
  e.preventDefault();
  position1.lat = coordinates[0].split(" ")[0];
  position1.lng = coordinates[0].split(" ")[1];
};
const containerStyle = {
  width: "400px",
  height: "400px",
};

const center = {
  lat: -33.9328,
  lng: 18.8644,
};

const position1 = {
  lat: -34.06729,
  lng: 18.85811,
};

const position2 = {
  lat: -33.931151,
  lng: 18.871074,
};

const position3 = {
  lat: -33.945824,
  lng: 18.858989,
};

const midpoint = {
  lat: -33.98142166666667,
  lng: 18.862724333333336,
};

let Map = () => (
  <div className="map">
    <div className="google-map">
      <LoadScript googleMapsApiKey="AIzaSyAw71uaQ28Y-SABJAkLueUlhtdcN1JAPzI">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={10.5}
        >
          <MarkerF
            position={position1}
            icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
          />
          <MarkerF
            position={position2}
            icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
          />
          <MarkerF
            position={position3}
            icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
          />
          <MarkerF
            position={midpoint}
            icon={"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"}
          />
        </GoogleMap>
      </LoadScript>
    </div>
  </div>
);

export default Map;
