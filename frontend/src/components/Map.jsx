import React, { useState, useRef } from "react";
import Geocode from "react-geocode";
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
  MarkerF,
} from "@react-google-maps/api";
import { useEffect } from "react";
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
  const location1Str = useRef("");
  const location2Str = useRef("");
  const location3Str = useRef("");
  const [location1, setLocation1] = useState("");
  const [location2, setLocation2] = useState("");
  const [location3, setLocation3] = useState("");
  const [midPoint, setMidPoint] = useState("");
  const [shouldShowLocations, setShouldShowLocations] = useState(false);
  const [shouldShowMidPoint, setShouldShowMidPoint] = useState(false);
  const [allCoordinates, setAllCoordinates] = useState([]);

  const toggleShow = (event) => {
    if (allCoordinates.length === 3) {
      setAllCoordinates((allCoordinates) => [...allCoordinates, midPoint]);
      setShouldShowLocations(true);
      event.target.style["background-color"] = "#944040";
    }
    if (allCoordinates.length === 4) {
      setShouldShowMidPoint(true);
      event.target.style["background-color"] = "#2b65b1";
    }
  };

  useEffect(() => {
    console.log(shouldShowLocations, shouldShowMidPoint);
  }, [shouldShowLocations, shouldShowMidPoint]);

  const handleChange = (event, locationStr, locationFunction) => {
    Geocode.fromAddress(locationStr.current.value).then(
      (response) => {
        const responseCoords = response.results[0].geometry.location;
        console.log(responseCoords);
        locationFunction(responseCoords);
      },
      (error) => {
        console.error(error);
      }
    );
    changeColor(event);
  };

  const changeColor = (event) => {
    event.target.style["background-color"] = "#4cb98c";
  };

  const handleSubmit = (e) => {
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
      console.log(info);
    })();
  };

  const handle = (e, location, locationFunction) => {
    let temp_loc = location.split(" ");
    let result = {
      lat: parseFloat(temp_loc[0]),
      lng: parseFloat(temp_loc[1]),
    };
    locationFunction({
      lat: result.lat,
      lng: result.lng,
    });
  };

  const getPoint = (e) => {
    e.preventDefault();
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
      let info = await fetchFunc();
      handle(e, info[3], setMidPoint);
      setAllCoordinates((allCoordinates) => [...allCoordinates, location1]);
      setAllCoordinates((allCoordinates) => [...allCoordinates, location2]);
      setAllCoordinates((allCoordinates) => [...allCoordinates, location3]);
    })(setMidPoint(""));
  };

  return (
    <div className="map">
      <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
        <div className="locations">
          <form className="locations form" onSubmit={handleSubmit}>
            <div className="box">
              <label>First location</label>
              <StandaloneSearchBox>
                <input
                  ref={location1Str}
                  type="text"
                  placeholder="eg. 'Neelsie'"
                  style={inputStyle}
                ></input>
              </StandaloneSearchBox>
              <button
                className="box button"
                type="button"
                onClick={(e) => {
                  handleChange(e, location1Str, setLocation1, location1);
                }}
              >
                Apply
              </button>
            </div>
            <div className="box">
              <label>Second location</label>
              <StandaloneSearchBox>
                <input
                  ref={location2Str}
                  type="text"
                  placeholder="eg. 'Endler'"
                  style={inputStyle}
                ></input>
              </StandaloneSearchBox>
              <button
                className="box button"
                type="button"
                onClick={(e) => {
                  handleChange(e, location2Str, setLocation2);
                }}
              >
                Apply
              </button>
            </div>
            <div className="box">
              <label>Third location</label>
              <StandaloneSearchBox>
                <input
                  ref={location3Str}
                  type="text"
                  placeholder="eg. 'Praelexis'"
                  style={inputStyle}
                ></input>
              </StandaloneSearchBox>
              <button
                className="box button"
                type="button"
                onClick={(e) => {
                  handleChange(e, location3Str, setLocation3);
                }}
              >
                Apply
              </button>
            </div>
            <button
              className="locations button"
              type="submit"
              onClick={changeColor}
            >
              Submit
            </button>
          </form>
          <form className="locations getPoint" onSubmit={getPoint}>
            <button
              className="locations button"
              type="submit"
              onClick={changeColor}
            >
              Get point
            </button>
          </form>
          <div className="locations showPoint">
            <button
              className="locations button"
              type="button"
              onClick={toggleShow}
            >
              Show point
            </button>
          </div>
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
                position={midPoint}
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

// location1.latitude = -33.93087933494542; -> eendrag
// location1.longitude = 18.872240042486016;
// location2.latitude = -33.93253245739606; -> neelsie
// location2.longitude = 18.86538266947165;
// Location 3 = -33.940743, 18.854595 Gino's