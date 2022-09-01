import React, { useState, useRef, useReducer } from "react";
import Geocode from "react-geocode";
import {
  GoogleMap,
  LoadScript,
  StandaloneSearchBox,
  MarkerF,
} from "@react-google-maps/api";
import { useEffect } from "react";
import "./map.css";
import LocationBox from "./LocationBox";

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

// const formReducer = (state, event) => {
//   return {
//     ...state,
//     [event.name]: event.value,
//   };
// };

let coordinates = [];

function Map() {
  // const [formData, setFormData] = useReducer(formReducer, {});
  const location1Str = useRef();
  const location2Str = useRef();
  const location3Str = useRef();

  const [data, setData] = useState([]);

  const [location1, setLocation1] = useState("");
  const [location2, setLocation2] = useState("");
  const [location3, setLocation3] = useState("");
  const [midPoint, setMidPoint] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  const changeColor = (event) => {
    event.target.style["background-color"] = "#4cb98c";
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (
      !location1Str.current.value ||
      !location2Str.current.value ||
      !location3Str.current.value
    ) {
      e.target.style["background-color"] = "red";
      return;
    }
    setSubmitting(true);

    if (location1Str.current.value === "") return;
    Geocode.fromAddress(location1Str.current.value).then(
      (response) => {
        const responseCoords = response.results[0].geometry.location;
        console.log(responseCoords);
        setLocation1(() => responseCoords);
        console.log(location2);
      },
      (error) => {
        console.error(error);
      }
    );

    if (location2Str === "") return;
    Geocode.fromAddress(location2Str.current.value).then(
      (response) => {
        const responseCoords = response.results[0].geometry.location;
        console.log(responseCoords);
        setLocation2(() => responseCoords);
        console.log(location2);
      },
      (error) => {
        console.error(error);
      }
    );

    if (location3Str === "") return;
    Geocode.fromAddress(location3Str.current.value).then(
      (response) => {
        const responseCoords = response.results[0].geometry.location;
        console.log(responseCoords);
        setLocation3(() => responseCoords);
        console.log(location3);
      },
      (error) => {
        console.error(error);
      }
    );
    changeColor(e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let timeOut = !location1 || !location2 || !location3 ? 3000 : 0;
    timeOut > 0
      ? console.log("Timing out")
      : console.log("No need for timeout");
    setTimeout(() => {
      console.log(`loc1: ${location1}`);
      console.log(`loc2: ${location2}`);
      console.log(`loc3: ${location3}`);
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
      setSubmitting(false);
    }, timeOut);
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
      // handle(e, info[3], setMidPoint);
      setMidPoint(info.coordinates);
      setData(info);
      coordinates = info.allCoordinates;

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
            {/* <LocationBox
              label={"Second location"}
              inputStyle={inputStyle}
              locationStr={location1Str}
              placeholder={"e.g. 'Neelsie'"}
              handleChange={(e) => {
                handleChange(e, location1Str, setLocation1, location1);
              }}
            /> */}

            {submitting && (
              <div>
                Submitting:
                <ul>
                  <li>
                    Location1:
                    <br /> lat: {location1.lat} | lon: {location1.lon}
                  </li>
                  <li>
                    Location2:
                    <br /> lat: {location2.lat} | lon: {location2.lon}
                  </li>
                  <li>
                    Location3:
                    <br /> lat: {location3.lat} | lon: {location3.lon}
                  </li>
                </ul>
              </div>
            )}

            <div className="box">
              <label>First location</label>
              <StandaloneSearchBox>
                <input
                  // ref={location1Str}
                  // name="location1Str"
                  type="text"
                  placeholder="eg. 'Neelsie'"
                  style={inputStyle}
                  ref={location1Str}
                  // onChange={handleChange}
                ></input>
              </StandaloneSearchBox>
            </div>
            <div className="box">
              <label>Second location</label>
              <StandaloneSearchBox>
                <input
                  ref={location2Str}
                  // name="location2Str"
                  type="text"
                  placeholder="eg. 'Endler'"
                  style={inputStyle}
                  // onChange={handleChange}
                ></input>
              </StandaloneSearchBox>
            </div>
            <div className="box">
              <label>Third location</label>
              <StandaloneSearchBox>
                <input
                  ref={location3Str}
                  // name="location3Str"
                  type="text"
                  placeholder="eg. 'Praelexis'"
                  style={inputStyle}
                  // onChange={handleChange}
                ></input>
              </StandaloneSearchBox>
            </div>
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

        {shouldShowLocations && (
          <>
            <h3>Midpoint = {midPoint}</h3>
            <table id="myTable" className="table table-available">
              <thead>
                <tr>
                  <th>Location:</th>
                  <th>Distances from Midpoint (kms)</th>
                  <th>Travel time from Midpoint (mins)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(data).map((value, index) => {
                  return (
                    <tr>
                      <td>{data.allCoordinates[index]} </td>
                      <td>{data.allDistances[index]}</td>
                      <td>{data.allTimes[index]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

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
                position={{
                  lat: midPoint[0],
                  lon: midPoint[1],
                }}
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
