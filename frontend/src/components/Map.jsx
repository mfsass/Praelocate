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

import InputBox from "./InputBox";
import InputTest from "./InputTest";
import "./map.css";

const libraries = ["places"];

const containerStyle = {
  width: "100%",
  height: "100%",
};

const inputStyle = {
  boxSizing: `border-box`,
  border: `1px solid transparent`,
  width: `100%`,
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
  const titleRefs = useRef([]);
  const stringRefs = useRef([]);
  const timeRefs = useRef([]);
  const [locations, setLocations] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [count, setCount] = useState(0);
  const [ranks, setRanks] = useState(Array(20).fill(-1));
  const [isFuzzy, setIsFuzzy] = useState(false);

  // const [location1Label, setLocation1Label] = useState("");
  // const [location2Label, setLocation2Label] = useState("");
  // const [location3Label, setLocation3Label] = useState("");
  // const [location4Label, setLocation4Label] = useState("");
  // const [location5Label, setLocation5Label] = useState("");
  // const [location6Label, setLocation6Label] = useState("");

  const [sliderValue, setSliderValue] = useState(1);
  const [preference, setPreference] = useState("time");
  const [center, setCenter] = useState({
    lat: -33.9328,
    lng: 18.8644,
  });

  const [submitting, setSubmitting] = useState(false);
  // const [infoWindowOpen1, setInfoWindowOpen1] = useState(false);
  // const [infoWindowOpen2, setInfoWindowOpen2] = useState(false);
  // const [infoWindowOpen3, setInfoWindowOpen3] = useState(false);
  // const [infoWindowOpen4, setInfoWindowOpen4] = useState(false);
  // const [infoWindowOpen5, setInfoWindowOpen5] = useState(false);
  // const [infoWindowOpen6, setInfoWindowOpen6] = useState(false);
  const [shouldShowLocations, setShouldShowLocations] = useState(false);
  const [shouldShowMidPoint, setShouldShowMidPoint] = useState(false);
  const [allCoordinates, setAllCoordinates] = useState([]);

  const toggleShow = (event) => {
    if (allCoordinates.midpoint) {
      setShouldShowMidPoint((shouldShowMidPoint) => !shouldShowMidPoint);
      changeColor(event, "#236F74");
    }
  };

  const changeColor = (event, color) => {
    let tempColor = color ? color : "#236F74";
    event.target.style["background-color"] = tempColor;
  };

  const addInput = () => {
    console.log(`Count: ${count}`);

    setLocations([
      ...locations,
      {
        id: count,
        coordinates: {
          lat: 0,
          lng: 0,
        },
        title: "",
        label: "",
        time: "12:00",
        shouldShow: false,
        rank: -1,
      },
    ]);

    // Adds new refs for the input components
    let lastTitleRef = (ref0) => titleRefs.current.push(ref0);
    let lastStringRef = (ref1) => stringRefs.current.push(ref1);
    let lastTimeRef = (ref2) => timeRefs.current.push(ref2);

    setInputs((state) => [
      ...state,
      <InputTest
        ref={{
          locationTitle: lastTitleRef,
          locationStr: lastStringRef,
          locationTime: lastTimeRef,
        }}
        changeRank={changeRank}
        name={count}
        setIsFuzzy={setIsFuzzy}
      />,
    ]);

    setCount(count + 1);
  };

  /*
    Called by the child
    !** important **! does not have the state of the parent
  */
  const changeRank = (index, value) => {
    console.log(`Changing rank ${index} to ${value}`);
    setRanks(
      ranks.map((item, i) => {
        if (i === index) {
          console.log("Changing");
          item = value;
          return item;
        } else {
          console.log("Not changing");
          return item;
        }
      })
    );
  };

  /**
   * Saves all the values and requests the coordinates from the google maps API
   */
  const handleSave = (event) => {
    event.preventDefault();

    stringRefs.current.forEach(async (string, index) => {
      try {
        console.log(`Trying: ${string.value}`);
      } catch (error) {
        console.log(`Aborting: ${string}`);
      }

      getGeoFromText(string.value, index).then((response) => {
        console.log(`Response: ${response.index}`);
        const index2 = response.index;
        const timeValue = timeRefs.current[index2].value;
        const tempLocation = {
          ...locations[index2],
          coordinates: response.coordinates,
          label: getLabel(stringRefs.current[index2].value),
          shouldShow: true,
          rank: ranks[index2] > 0 ? ranks[index2] : 1,
          time: timeValue !== "" ? timeValue : "12:00",
          title: titleRefs.current[index2].value,
        };

        setLocations(
          locations.map((item, i) => {
            if (i === index2) {
              locations[i] = tempLocation;
              return locations[i];
            } else return locations[i];
          })
        );
      });
    });

    changeColor(event);
  };

  const getLabel = (value) => {
    return value.substring(0, value.indexOf(","));
  };

  const getGeoFromText = async (text, index) => {
    console.log(`Trying geo ${index}`);
    if (text) {
      return await Geocode.fromAddress(text).then(
        (response) => {
          return {
            index: index,
            coordinates: response.results[0].geometry.location,
          };
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

    let tempLocations = [];
    if (isFuzzy) {
      let index = -1;
      Object.keys(locations).forEach((key) => {
        console.log(locations[key]);
        if (!locations[key].title.toLowerCase().includes("school")) {
          tempLocations.push(locations[key]);
        }
      });
    } else {
      tempLocations = [...locations];
    }
    console.log("Templocations");
    console.log(tempLocations);

    let data = {
      locations: tempLocations,
      radius: { size: sliderValue },
      optimize: { preference: preference },
      isFuzzy: isFuzzy,
    };

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

      locations.map((item, index) => {
        return `${getLabel(stringRefs.current[index].value)} | Distance: ${
          info.allDistances[index]
        }| Time: ${info.allDistances[index]}`;
      });

      // if (info.allDistances.length >= 1) {
      //   setLocation1Label(
      //     (previousData) =>
      //       `${previousData} | Distance: ${info.allDistances[0]} | Time: ${info.allTimes[0]}`
      //   );
      // }
      // if (info.allDistances.length >= 2) {
      //   setLocation2Label(
      //     (previousData) =>
      //       `${previousData} | Distance: ${info.allDistances[1]} | Time: ${info.allTimes[1]}`
      //   );
      // }
      // if (info.allDistances.length >= 3) {
      //   setLocation3Label(
      //     (previousData) =>
      //       `${previousData} | Distance: ${info.allDistances[2]} | Time: ${info.allTimes[2]}`
      //   );
      // }
      // if (info.allDistances.length >= 4) {
      //   setLocation4Label(
      //     (previousData) =>
      //       `${previousData} | Distance: ${info.allDistances[3]} | Time: ${info.allTimes[3]}`
      //   );
      // }
      // if (info.allDistances.length >= 5) {
      //   setLocation5Label(
      //     (previousData) =>
      //       `${previousData} | Distance: ${info.allDistances[4]} | Time: ${info.allTimes[4]}`
      //   );
      // }
      // if (info.allDistances.length >= 6) {
      //   setLocation6Label(
      //     (previousData) =>
      //       `${previousData} | Distance: ${info.allDistances[5]} | Time: ${info.allTimes[5]}`
      //   );
      // }

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

  // const getRank = (value, name) => {
  //   switch (name) {
  //     case "loc1":
  //       setRank1(value);
  //       break;
  //     case "loc2":
  //       setRank2(value);
  //       break;
  //     case "loc3":
  //       setRank3(value);
  //       break;
  //     case "loc4":
  //       setRank4(value);
  //       break;
  //     case "loc5":
  //       setRank5(value);
  //       break;
  //     case "loc6":
  //       setRank6(value);
  //       break;
  //     default:
  //       console.log("Unhandled");
  //   }
  // };

  const getValues = () => {
    console.log("*** Title refs: ***");
    console.log(titleRefs.current);
    titleRefs.current.forEach((ref, index) => {
      console.log(`Title value [${index}]: ${ref.value}`);
    });

    console.log("*** String refs: ***");
    console.log(stringRefs.current);
    stringRefs.current.forEach((ref, index) => {
      console.log(`Input value [${index}]: ${ref.value}`);
    });

    console.log("*** Time refs: ***");
    console.log(timeRefs.current);
    timeRefs.current.forEach((ref, index) => {
      console.log(`Time value [${index}]: ${ref.value}`);
    });

    console.log("*** Ranks: ***");
    console.log(ranks);
    console.log("*** Locations: ***");
    console.log(locations);

    console.log(`*** Is fuzzy? ${isFuzzy} ***`);
  };

  return (
    <div className="map">
      <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
        <div className="locations">
          <form className="locations form" onSubmit={handleSubmit}>
            {inputs.map((input, index) => {
              return (
                <div className="box" key={index}>
                  {input}
                </div>
              );
            })}
            <div className="locations add">
              <label>Add a location</label>
              <button type="button" onClick={addInput}>
                +
              </button>
              <button type="button" onClick={getValues}>
                GET
              </button>
            </div>
            {/* <InputBox
              label="Work"
              name="loc1"
              inputStyle={inputStyle}
              ref={location1Ref}
              placeholder={"e.g. Praelexis"}
              getRank={getRank}
              rank={rank1}
            />

            <InputBox
              label="Work 2"
              name="loc2"
              inputStyle={inputStyle}
              ref={location2Ref}
              placeholder={"e.g. Stellenbosch University"}
              getRank={getRank}
              rank={rank2}
            />

            <InputBox
              label="School"
              name="loc3"
              inputStyle={inputStyle}
              ref={location3Ref}
              placeholder={"e.g. Paul Roos"}
              getRank={getRank}
              rank={rank3}
            />

            <InputBox
              label="Mall"
              name="loc4"
              inputStyle={inputStyle}
              ref={location4Ref}
              placeholder={"e.g. Eikestad Mall"}
              getRank={getRank}
              rank={rank4}
            />

            <InputBox
              label="Gym"
              name="loc5"
              inputStyle={inputStyle}
              ref={location5Ref}
              placeholder={"e.g. Virgin Active Stellenbosch"}
              getRank={getRank}
              rank={rank5}
            />

            <InputBox
              label="Park"
              name="loc6"
              inputStyle={inputStyle}
              ref={location6Ref}
              placeholder={"e.g. Uniepark"}
              getRank={getRank}
              rank={rank6}
            /> */}

            <div className="locations slider">
              <div>Output radius:</div>

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

              <div> {sliderValue} km </div>
            </div>

            <div className="locations preference">
              <div>Calculation preference: </div>
              <div className="preference options">
                <label>Distance</label>
                <input
                  type="radio"
                  name="preference"
                  onClick={() => setPreference("distance")}
                />
                <label>Time</label>
                <input
                  type="radio"
                  name="preference"
                  onClick={() => setPreference("time")}
                />
              </div>
            </div>

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

          {/* {allCoordinates.midpoint && (
            <span>
              Midpoint:
              {allCoordinates.midpoint.lat},{allCoordinates.midpoint.lng}
            </span>
          )} */}
        </div>

        <div className="googleMap">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
          >
            {shouldShowLocations && (
              <div>
                {/* <MarkerF
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
                </MarkerF> */}
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
