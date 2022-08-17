import React, { useState, useRef, useCallback } from "react";
import {
  useJsApiLoader,
  Autocomplete,
  GoogleMap,
  LoadScript,
  Marker,
  StandaloneSearchBox,
} from "@react-google-maps/api";
import LocationBox from "./LocationBox";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

import "./locations.css";

const containerStyle = {
  width: "400px",
  height: "400px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

function Locations() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAw71uaQ28Y-SABJAkLueUlhtdcN1JAPzI",
  });

  const [map, setMap] = useState(/** @type google.maps.map */ null);

  const [location1, setLocation1] = useState("");
  const [location2, setLocation2] = useState("");
  const [location3, setLocation3] = useState("");

  const originRef = useRef();
  const destinationRef = useRef();

  const center = {
    lat: -33.93087933494542,
    lng: 18.872240042486016,
  };

  const containerStyle = {
    width: "600px",
    height: "400px",
  };

  const handleSubmit = (e) => {
    // location1.latitude = -33.93087933494542; -> eendrag
    // location1.longitude = 18.872240042486016;
    // location2.latitude = -33.93253245739606; -> neelsie
    // location2.longitude = 18.86538266947165;
    // Location 3 = -33.940743, 18.854595 Gino's
    e.preventDefault();
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location1: location1,
        location2: location2,
        location3: location3,
      }),
    };
    async function fetchFunc() {
      return await fetch("/locations", requestOpt)
        .then((response) => response.json())
        .catch((error) => console.log(error));
    }
    (async () => {
      let info = await fetchFunc();
      alert("Time:" + info.time + " mins");
      alert("Distance:" + info.distance + " km's");
      alert(info.coordinates);
    })();
  };

  const onLoad = React.useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <form className="locationForm" onSubmit={handleSubmit}>
      <LoadScript
        googleMapsApiKey="AIzaSyAw71uaQ28Y-SABJAkLueUlhtdcN1JAPzI"
        libraries={["places"]}
      >
        <Autocomplete>
          <input type="text" placeholder="hi"></input>
        </Autocomplete>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Child components, such as markers, info windows, etc. */}
          <Marker position={center} />
          <StandaloneSearchBox>
            <input type="text" placeholder="Hi"></input>
          </StandaloneSearchBox>
        </GoogleMap>
        {/* <Autocomplete>
          <input type="text" placeholder="Location1" ref={originRef}></input>
        </Autocomplete> */}
        <LocationBox
          label="Location 1 (in Decimal Degrees)"
          passLocation={setLocation1}
        />
        <LocationBox
          label="Location 2 (in Decimal Degrees)"
          passLocation={setLocation2}
        />
        <LocationBox
          label="Location 3 (in Decimal Degrees)"
          passLocation={setLocation3}
        />
        <button className="location button" type="submit">
          Submit
        </button>
      </LoadScript>
    </form>
  ) : (
    <></>
  );
}

export default Locations;
