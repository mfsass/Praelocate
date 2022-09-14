import React, { useState, useRef } from "react";
import ReactSlider from "react-slider";
import Geocode from "react-geocode";
import {
  GoogleMap,
  LoadScript,
  MarkerF,
  CircleF,
  InfoWindowF,
} from "@react-google-maps/api";

import TestComponent from "./TestComponent";
import "./map.css";
import "./testComponent.css";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
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
  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [location3, setLocation3] = useState(null);
  const [location4, setLocation4] = useState(null);
  const [location5, setLocation5] = useState(null);
  const [location6, setLocation6] = useState(null);

  const location1Str = useRef();
  const location2Str = useRef();
  const location3Str = useRef();
  const location4Str = useRef();
  const location5Str = useRef();
  const location6Str = useRef();

  const location1Time = useRef();
  const location2Time = useRef();
  const location3Time = useRef();
  const location4Time = useRef();
  const location5Time = useRef();
  const location6Time = useRef();

  const location1Ref = useRef({
    locationStr: location1Str,
    locationTime: location1Time,
  });
  const location2Ref = useRef({
    locationStr: location2Str,
    locationTime: location2Time,
  });
  const location3Ref = useRef({
    locationStr: location3Str,
    locationTime: location3Time,
  });
  const location4Ref = useRef({
    locationStr: location4Str,
    locationTime: location4Time,
  });
  const location5Ref = useRef({
    locationStr: location5Str,
    locationTime: location5Time,
  });
  const location6Ref = useRef({
    locationStr: location6Str,
    locationTime: location6Time,
  });

  const [rank1, setRank1] = useState(0);
  const [rank2, setRank2] = useState(0);
  const [rank3, setRank3] = useState(0);
  const [rank4, setRank4] = useState(0);
  const [rank5, setRank5] = useState(0);
  const [rank6, setRank6] = useState(0);
  const [location1Label, setLocation1Label] = useState("");
  const [location2Label, setLocation2Label] = useState("");
  const [location3Label, setLocation3Label] = useState("");
  const [location4Label, setLocation4Label] = useState("");
  const [location5Label, setLocation5Label] = useState("");
  const [location6Label, setLocation6Label] = useState("");

  const [sliderValue, setSliderValue] = useState(1);
  const [center, setCenter] = useState({
    lat: -33.9328,
    lng: 18.8644,
  });

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

  const handleSave = (event) => {
    event.preventDefault();

    const locations = [
      {
        string: location1Str,
        function: setLocation1,
        labelFunction: setLocation1Label,
      },
      {
        string: location2Str,
        function: setLocation2,
        labelFunction: setLocation2Label,
      },
      {
        string: location3Str,
        function: setLocation3,
        labelFunction: setLocation3Label,
      },
      {
        string: location4Str,
        function: setLocation4,
        labelFunction: setLocation4Label,
      },
      {
        string: location5Str,
        function: setLocation5,
        labelFunction: setLocation5Label,
      },
      {
        string: location6Str,
        function: setLocation6,
        labelFunction: setLocation6Label,
      },
    ];
    locations.map((entry) => {
      try {
        console.log(`Trying: ${entry.string.current.value}`);
      } catch (error) {
        console.log(`aborting: ${entry}`);
        return undefined;
      }
      const temp = entry.string.current.value;
      entry.labelFunction(temp.substring(0, temp.indexOf(",")));
      return getGeoFromText(entry.string.current.value, entry.function);
    });

    changeColor(event);
  };

  const getGeoFromText = (text, changeLocation) => {
    if (text) {
      Geocode.fromAddress(text).then(
        (response) => {
          changeLocation(() => response.results[0].geometry.location);
        },
        (error) => {
          console.error(error);
        }
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    let data = {
      radius: {
        size: sliderValue,
      },
    };

    if (location1) {
      data.loc1 = {
        lat: location1.lat,
        lng: location1.lng,
        rank: rank1,
        time: location1Time.current.value,
      };
    }

    if (location2) {
      data.loc2 = {
        lat: location2.lat,
        lng: location2.lng,
        rank: rank2,
        time: location2Time.current.value,
      };
    }

    if (location3) {
      data.loc3 = {
        lat: location3.lat,
        lng: location3.lng,
        rank: rank3,
        time: location3Time.current.value,
      };
    }

    if (location4) {
      data.loc4 = {
        lat: location4.lat,
        lng: location4.lng,
        rank: rank4,
        time: location4Time.current.value,
      };
    }

    if (location5) {
      data.loc5 = {
        lat: location5.lat,
        lng: location5.lng,
        rank: rank5,
        time: location5Time.current.value,
      };
    }

    if (location6) {
      data.loc6 = {
        lat: location6.lat,
        lng: location6.lng,
        rank: rank6,
        time: location6Time.current.value,
      };
    }

    console.log(JSON.stringify(data));
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
      setAllCoordinates((previousState) => ({
        ...previousState,
        midpoint: info.midpoint,
      }));
      setCenter(info.midpoint);
      setSubmitting(false);
    })();
    setShouldShowLocations(true);
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
  return (
    <div className="map">
      <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
        <div className="locations">
          <form className="locations form" onSubmit={handleSubmit}>
            <TestComponent
              label="Location 1"
              name="loc1"
              inputStyle={inputStyle}
              ref={location1Ref}
              placeholder={"e.g. Praelexis"}
              getRank={getRank}
              rank={rank1}
            />

            <TestComponent
              label="Location 2"
              name="loc2"
              inputStyle={inputStyle}
              ref={location2Ref}
              placeholder={"e.g. Endler"}
              getRank={getRank}
              rank={rank2}
            />

            <TestComponent
              label="Location 3"
              name="loc3"
              inputStyle={inputStyle}
              ref={location3Ref}
              placeholder={"e.g. Neelsie"}
              getRank={getRank}
              rank={rank3}
            />

            <TestComponent
              label="Location 4"
              name="loc4"
              inputStyle={inputStyle}
              ref={location4Ref}
              placeholder={"e.g. Eikestad Mall"}
              getRank={getRank}
              rank={rank4}
            />

            <TestComponent
              label="Location 5"
              name="loc5"
              inputStyle={inputStyle}
              ref={location5Ref}
              placeholder={"e.g. Paul Roos"}
              getRank={getRank}
              rank={rank5}
            />

            <TestComponent
              label="Location 6"
              name="loc6"
              inputStyle={inputStyle}
              ref={location6Ref}
              placeholder={"e.g. Danie Craven"}
              getRank={getRank}
              rank={rank6}
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
                  onClick={() => setInfoWindowOpen1(true)}
                >
                  {infoWindowOpen1 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen1(false)}>
                      <div>{location1Label}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location2"}
                  position={location2}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={() => setInfoWindowOpen2(true)}
                >
                  {infoWindowOpen2 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen2(false)}>
                      <div>{location2Label}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location3"}
                  position={location3}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={() => setInfoWindowOpen3(true)}
                >
                  {infoWindowOpen3 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen3(false)}>
                      <div>{location3Label}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location4"}
                  position={location4}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={() => setInfoWindowOpen4(true)}
                >
                  {infoWindowOpen4 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen4(false)}>
                      <div>{location4Label}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location5"}
                  position={location5}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={() => setInfoWindowOpen5(true)}
                >
                  {infoWindowOpen5 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen5(false)}>
                      <div>{location5Label}</div>
                    </InfoWindowF>
                  )}
                </MarkerF>
                <MarkerF
                  title={"location6"}
                  position={location6}
                  icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                  onClick={() => setInfoWindowOpen6(true)}
                >
                  {infoWindowOpen6 && (
                    <InfoWindowF onCloseClick={() => setInfoWindowOpen6(false)}>
                      <div>{location6Label}</div>
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
