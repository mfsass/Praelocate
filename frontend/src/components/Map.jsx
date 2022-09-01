import React, { useState, useRef } from "react";
import Geocode from "react-geocode";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";

import LocationBox from "./LocationBox";
import "./map.css";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: -33.9328,
  lng: 18.8644,
};

const inputStyle = {
  boxSizing: `border-box`,
  border: `1px solid transparent`,
  width: `240px`,
  height: `32px`,
  padding: `0 12px`,
  borderRadius: `7px`,
  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
  fontSize: `14px`,
  outline: `none`,
  textOverflow: `ellipses`,
};

const API_KEY = "AIzaSyAw71uaQ28Y-SABJAkLueUlhtdcN1JAPzI";
Geocode.setApiKey(API_KEY);
Geocode.setRegion("za");

function Map() {
  const location1Str = useRef();
  const location2Str = useRef();
  const location3Str = useRef();

  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [location3, setLocation3] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [shouldShowLocations, setShouldShowLocations] = useState(false);
  const [shouldShowMidPoint, setShouldShowMidPoint] = useState(false);
  const [allCoordinates, setAllCoordinates] = useState([]);

  const toggleShow = (event) => {
    if (allCoordinates.midpoint) {
      setShouldShowMidPoint((shouldShowMidPoint) => !shouldShowMidPoint);
      changeColor(event, "#2b65b1");
    }
  };

  const changeColor = (event, color) => {
    let tempColor = color ? color : "#4cb98c";
    event.target.style["background-color"] = tempColor;
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (
      !location1Str.current.value ||
      !location2Str.current.value ||
      !location3Str.current.value
    ) {
      changeColor("red");
      return;
    }

    const locations = [
      {
        string: location1Str,
        function: setLocation1,
      },
      {
        string: location2Str,
        function: setLocation2,
      },
      {
        string: location3Str,
        function: setLocation3,
      },
    ];
    locations.map((entry) => {
      return getGeoFromText(entry.string.current.value, entry.function);
    });

    changeColor(event);
  };

  const getGeoFromText = (text, changeLocation) => {
    if (!text) {
      changeColor("red");
    }

    Geocode.fromAddress(text).then(
      (response) => {
        changeLocation(() => response.results[0].geometry.location);
      },
      (error) => {
        console.error(error);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    let timeOut = !location1 || !location2 || !location3 ? 3000 : 0;
    timeOut > 0
      ? console.log("Timing out")
      : console.log("No need for timeout");
    setTimeout(() => {
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
        console.log(info);
        setAllCoordinates(info.allCoordinates);
        setSubmitting(false);
      })();
      setShouldShowLocations(true);
    }, timeOut);
  };

  return (
    <div className="map">
      <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
        <div className="locations">
          <form className="locations form" onSubmit={handleSubmit}>
            <LocationBox
              label={"First location"}
              inputStyle={inputStyle}
              ref={location1Str}
              placeholder={"e.g. 'Neelsie'"}
            />

            <LocationBox
              label={"Second location"}
              inputStyle={inputStyle}
              ref={location2Str}
              placeholder={"e.g. 'Endler'"}
            />

            <LocationBox
              label={"Third location"}
              inputStyle={inputStyle}
              ref={location3Str}
              placeholder={"e.g. 'Praelexis'"}
            />

            <div className="box button">
              <button
                className="locations button"
                type="submit"
                onClick={(event) => {
                  handleSave(event);
                }}
              >
                Save
              </button>
              <button
                className="locations button"
                type="submit"
                onClick={changeColor}
              >
                Submit
              </button>
              <button
                className="locations button"
                type="button"
                onClick={toggleShow}
              >
                Show point
              </button>
            </div>
          </form>
          {submitting && <span>Submitting ... </span>}

          {allCoordinates.midpoint && (
            <span>
              Midpoint:
              {allCoordinates.midpoint.lat},{allCoordinates.midpoint.lng}
            </span>
          )}
        </div>

        <div className="googleMap">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
          >
            {shouldShowLocations && (
              <div>
                <MarkerF
                  position={location1}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                />
                <MarkerF
                  position={location2}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                />
                <MarkerF
                  position={location3}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                />
              </div>
            )}
            {shouldShowMidPoint && (
              <MarkerF
                position={allCoordinates.midpoint}
                icon={"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"}
              />
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
}

export default Map;
