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
var location4StrSpan;
var location5StrSpan;
var location6StrSpan;

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
  const location4Str = useRef();
  const location5Str = useRef();
  const location6Str = useRef();

  const [rank1, setRank1] = useState(0);
  const [rank2, setRank2] = useState(0);
  const [rank3, setRank3] = useState(0);
  const [rank4, setRank4] = useState(0);
  const [rank5, setRank5] = useState(0);
  const [rank6, setRank6] = useState(0);
  const [sliderValue, setSliderValue] = useState(1);

  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [location3, setLocation3] = useState(null);
  const [location4, setLocation4] = useState(null);
  const [location5, setLocation5] = useState(null);
  const [location6, setLocation6] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [infoWindowOpen1, setInfoWindowOpen1] = useState(false);
  const [infoWindowOpen2, setInfoWindowOpen2] = useState(false);
  const [infoWindowOpen3, setInfoWindowOpen3] = useState(false);
  const [infoWindowOpen4, setInfoWindowOpen4] = useState(false);
  const [infoWindowOpen5, setInfoWindowOpen5] = useState(false);
  const [infoWindowOpen6, setInfoWindowOpen6] = useState(false);
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

  const showInfoWindow4 = () => {
    const temp = location4Str.current.value;
    const indexOf = temp.indexOf(",");
    location4StrSpan = <span>{`${temp.substring(0, indexOf)}`}</span>;
    setInfoWindowOpen4(true);
  };

  const showInfoWindow5 = () => {
    const temp = location5Str.current.value;
    const indexOf = temp.indexOf(",");
    location5StrSpan = <span>{`${temp.substring(0, indexOf)}`}</span>;
    setInfoWindowOpen5(true);
  };

  const showInfoWindow6 = () => {
    const temp = location6Str.current.value;
    const indexOf = temp.indexOf(",");
    location6StrSpan = <span>{`${temp.substring(0, indexOf)}`}</span>;
    setInfoWindowOpen6(true);
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (
      !location1Str.current.value ||
      !location2Str.current.value ||
      !location3Str.current.value ||
      !location4Str.current.value ||
      !location5Str.current.value ||
      !location6Str.current.value
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
      {
        string: location4Str,
        function: setLocation4,
      },
      {
        string: location5Str,
        function: setLocation5,
      },
      {
        string: location6Str,
        function: setLocation6,
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
    let timeOut = !location1 || !location2 || !location3 || !location4 || !location5 || !location6 ? 3000 : 0;
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
      location4: {
        lat: location4.lat,
        lng: location4.lng,
        rank: rank4,
      },
      location5: {
        lat: location5.lat,
        lng: location5.lng,
        rank: rank5,
      },
      location6: {
        lat: location6.lat,
        lng: location6.lng,
        rank: rank6,
      },
      radius: {
        size: sliderValue,
      }
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
      case "loc4":
        setRank4(value);
        break;
      case "loc5":
        setRank5(value);
        break;
      case "loc6":
        setRank6(value);
        break;
      default:
        console.log("Unhandled");
    }
  };

  useEffect(() => {
    console.log(`Rank 1: ${rank1}, Rank 2: ${rank2}, Rank 3: ${rank3}, Rank 4: ${rank4}, Rank 5: ${rank5}, Rank 6: ${rank6}`);
  }, [rank1, rank2, rank3, rank4, rank5, rank6]);

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

            <TestComponent
              label="Location 4"
              name="loc4"
              inputStyle={inputStyle}
              ref={location4Str}
              placeholder={"e.g. Eikestad Mall"}
              getRank={getRank}
            />

            <TestComponent
              label="Location 5"
              name="loc5"
              inputStyle={inputStyle}
              ref={location5Str}
              placeholder={"e.g. Paul Roos"}
              getRank={getRank}
            />

            <TestComponent
              label="Location 6"
              name="loc6"
              inputStyle={inputStyle}
              ref={location6Str}
              placeholder={"e.g. Danie Craven"}
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
                <MarkerF
                  title={"location4"}
                  position={location4}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={showInfoWindow4}
                >
                  {infoWindowOpen4 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen4(false)}>
                      <div>{location4StrSpan}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location5"}
                  position={location5}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={showInfoWindow5}
                >
                  {infoWindowOpen5 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen5(false)}>
                      <div>{location5StrSpan}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location6"}
                  position={location6}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={showInfoWindow6}
                >
                  {infoWindowOpen6 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen6(false)}>
                      <div>{location6StrSpan}</div>
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
