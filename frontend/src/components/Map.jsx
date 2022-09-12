import React, { useState, useRef, useEffect } from "react";
import ReactSlider from "react-slider";
import Geocode from "react-geocode";
import {
  GoogleMap,
  LoadScript,
  MarkerF,
  CircleF,
  InfoWindowF,
} from "@react-google-maps/api";

import "./map.css";
import TestComponent from "./TestComponent";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};

var location1StrSpan;
var location2StrSpan;
var location3StrSpan;

const center = {
  lat: -33.9328,
  lng: 18.8644,
};

const inputStyle = {
  boxSizing: `border-box`,
  border: `1px solid transparent`,
  width: `100%`,
  // height: `32px`,
  padding: `0 12px`,
  borderRadius: `7px`,
  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
  fontSize: `14px`,
  outline: `none`,
  textOverflow: `ellipses`,
};

const options = {
  strokeColor: "#5982E2",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#5982E2",
  fillOpacity: 0.35,
};

const API_KEY = process.env.REACT_APP_API_KEY;

Geocode.setApiKey(API_KEY);
Geocode.setRegion("za");

function Map() {
  const location1Str = useRef();
  const location2Str = useRef();
  const location3Str = useRef();

  const [rank1, setRank1] = useState(0);
  const [rank2, setRank2] = useState(0);
  const [rank3, setRank3] = useState(0);
  const [sliderValue, setSliderValue] = useState(1);

  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [location3, setLocation3] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [infoWindowOpen1, setInfoWindowOpen1] = useState(false);
  const [infoWindowOpen2, setInfoWindowOpen2] = useState(false);
  const [infoWindowOpen3, setInfoWindowOpen3] = useState(false);
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

  const showInfoWindow1 = () => {
    const temp = location1Str.current.value;
    const indexOf = temp.indexOf(",");
    location1StrSpan = <span>{`${temp.substring(0, indexOf)}`}</span>;
    setInfoWindowOpen1(true);
  };

  const showInfoWindow2 = () => {
    const temp = location2Str.current.value;
    const indexOf = temp.indexOf(",");
    location2StrSpan = <span>{`${temp.substring(0, indexOf)}`}</span>;
    setInfoWindowOpen2(true);
  };

  const showInfoWindow3 = () => {
    const temp = location3Str.current.value;
    const indexOf = temp.indexOf(",");
    location3StrSpan = <span>{`${temp.substring(0, indexOf)}`}</span>;
    setInfoWindowOpen3(true);
  };

  const handleSave = (event) => {
    event.preventDefault();
    alert(sliderValue);
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
    let data = {
      location1: {
        lat: location1.lat,
        lng: location1.lng,
        rank: rank1,
      },
      location2: {
        lat: location2.lat,
        lng: location2.lng,
        rank: rank2,
      },
      location3: {
        lat: location3.lat,
        lng: location3.lng,
        rank: rank3,
      },
    };
    console.log(JSON.stringify(data));
    timeOut > 0
      ? console.log("Timing out")
      : console.log("No need for timeout");
    setTimeout(() => {
      const requestOpt = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  const getRank = (value, name) => {
    switch (name) {
      case "loc1":
        setRank1(value);
        break;
      case "loc2":
        setRank2(value);
        break;
      case "loc3":
        setRank3(value);
        break;
      default:
        console.log("Unhandled");
    }
  };

  useEffect(() => {
    console.log(`Rank 1: ${rank1}, Rank 2: ${rank2}, Rank 3: ${rank3}`);
  }, [rank1, rank2, rank3]);

  return (
    <div className="map">
      <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
        <div className="locations">
          <form className="locations form" onSubmit={handleSubmit}>
            <TestComponent
              label="Location 1"
              name="loc1"
              inputStyle={inputStyle}
              ref={location1Str}
              placeholder={"e.g. Praelexis"}
              getRank={getRank}
            />

            <TestComponent
              label="Location 2"
              name="loc2"
              inputStyle={inputStyle}
              ref={location2Str}
              placeholder={"e.g. Endler"}
              getRank={getRank}
            />

            <TestComponent
              label="Location 3"
              name="loc3"
              inputStyle={inputStyle}
              ref={location3Str}
              placeholder={"e.g. Neelsie"}
              getRank={getRank}
            />

            <ReactSlider 
              className="customSlider"
              trackClassName="customSlider-track"
              thumbClassName="customSlider-thumb"
              markClassName="customSlider-mark"
              marks={1}
              min={1}
              max={10}
              defaultValue={1}
              value={sliderValue}
              onChange={(value) => setSliderValue(value)}
            />

            <div> {sliderValue}km </div>
            {/* <LocationBox
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
            /> */}

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
                  title={"location1"}
                  position={location1}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={showInfoWindow1}
                >
                  {infoWindowOpen1 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen1(false)}>
                      <div> {location1StrSpan} </div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location2"}
                  position={location2}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={showInfoWindow2}
                >
                  {infoWindowOpen2 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen2(false)}>
                      <div>{location2StrSpan}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location3"}
                  position={location3}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={showInfoWindow3}
                >
                  {infoWindowOpen3 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen3(false)}>
                      <div>{location3StrSpan}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
              </div>
            )}
            {shouldShowMidPoint && (
              <CircleF
                center={allCoordinates.midpoint}
                radius={sliderValue * 1000}
                options={options}
              />
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
}

export default Map;
