import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
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
import Spinner from "./Spinner";
import {
  MAPS_LIBRARIES,
  CIRCLE_OPTIONS,
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  MAX_LOCATIONS,
  DEFAULT_TIME,
  SUCCESS_MESSAGE_DURATION,
  DEFAULT_PREFERENCES,
} from "../constants";
import "./map.css";

// TODO: Split this large component into smaller, manageable components
// TODO: Extract business logic into custom hooks (useLocations, useMapData)
// TODO: Add proper TypeScript types for better type safety
// TODO: Optimize re-renders with useMemo and useCallback
// TODO: Add unit tests for core functionality
// TODO: Implement debouncing for API calls to reduce costs

const containerStyle = {
  width: "100%",
  height: "100%",
};

function Map({ apiKey }) {
  // Initialize Geocode with the provided API key
  useEffect(() => {
    if (apiKey) {
      Geocode.setApiKey(apiKey);
      Geocode.setRegion("za"); // TODO: Make region configurable based on user location
    }
  }, [apiKey]);
  const titleRefs = useRef([]);
  const stringRefs = useRef([]);
  const timeRefs = useRef([]);
  const [locations, setLocations] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [count, setCount] = useState(0);
  const [ranks, setRanks] = useState(Array(MAX_LOCATIONS).fill(-1));
  const [infoWindows, setInfoWindows] = useState([]);
  const [schools, setSchools] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [medPrice, setMedPrice] = useState(0);
  const [isFuzzy, setIsFuzzy] = useState(false);
  const [shouldHospital, setShouldHospital] = useState(false);
  const [sliderValue, setSliderValue] = useState(1);
  const [preference, setPreference] = useState(DEFAULT_PREFERENCES.time);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);

  const [submitting, setSubmitting] = useState(false);
  const [shouldShowLocations, setShouldShowLocations] = useState(false);
  const [shouldShowMidPoint, setShouldShowMidPoint] = useState(false);
  const [allCoordinates, setAllCoordinates] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [locationLabels, setLocationLabels] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  // TODO: Refactor this function to be more modular and testable
  // TODO: Add validation for maximum number of locations
  const addInput = () => {
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
        time: DEFAULT_TIME,
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
      <InputBox
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

    setInfoWindows([...infoWindows, false]);

    setCount(count + 1);
  };

  /*
    Called by the child
    !** important **! does not have the state of the parent
  */
  const changeRank = (index, value) => {
    setRanks(
      ranks.map((item, i) => {
        if (i === index) {
          item = value;
          return item;
        } else {
          return item;
        }
      })
    );
  };

  /**
   * Saves all the values and requests the coordinates from the google maps API
   * TODO: Add validation before saving (check for empty fields)
   * TODO: Show user feedback (success/error messages)
   * TODO: Handle API rate limiting gracefully
   * TODO: Add cancel/reset functionality
   */
  const handleSave = (event) => {
    event.preventDefault();

    stringRefs.current.forEach(async (string, index) => {
      if (
        titleRefs.current[index].value.toLowerCase().includes("school") &&
        isFuzzy
      ) {
        let tempList = {
          ...locations,
        };
        tempList[index].title = titleRefs.current[index].value;
        return setLocations(tempList);
      }

      getGeoFromText(string.value, index).then((response) => {
        if (!response) {
          // Error already handled in getGeoFromText
          return;
        }
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
      }).catch((error) => {
        console.error("Error saving location:", error);
      });
    });

    changeColor(event);
  };

  const getLabel = (value) => {
    return value.substring(0, value.indexOf(","));
  };

  const getGeoFromText = async (text, index) => {
    if (text) {
      try {
        const response = await Geocode.fromAddress(text);
        if (!response.results || response.results.length === 0) {
          throw new Error(`No results found for: ${text}`);
        }
        return {
          index: index,
          coordinates: response.results[0].geometry.location,
        };
      } catch (error) {
        // Keep error logging for debugging geocoding issues
        console.error(`Geocoding error for "${text}":`, error);
        setError(`Failed to geocode location: "${text}". Please check the address and try again.`);
        return null;
      }
    }
    return null;
  };

  // TODO: Refactor this large function into smaller, focused functions
  // TODO: Implement loading states for each async operation
  // TODO: Add request cancellation support (AbortController)
  // TODO: Cache results to avoid repeated API calls
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    let tempLocations = [];
    if (isFuzzy) {
      Object.keys(locations).forEach((key) => {
        if (!locations[key].title.toLowerCase().includes("school")) {
          tempLocations.push(locations[key]);
        }
      });
    } else {
      tempLocations = [...locations];
    }

    if (tempLocations.length === 0) {
      setError("Please add at least one location before submitting.");
      setSubmitting(false);
      return;
    }

    let data = {
      locations: tempLocations,
      radius: sliderValue,
      preference: preference,
      hospitals: shouldHospital,
      isFuzzy: isFuzzy,
    };
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    async function fetchFunc() {
      return await fetch("/locations", requestOpt)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          return response.json();
        })
        .catch((error) => {
          throw error;
        });
    }
    (async () => {
      try {
        let info = await fetchFunc();

        if (!info || !info.allCoordinates) {
          throw new Error("Invalid response from server");
        }

      let tempLabels = [];

      locations.map((item) => {
        let index = info.allCoordinates.findIndex(
          (coor) => coor[0] === item.coordinates.lat
        ); // makes sure to map the correct distance and times to the correct location
        if (index >= 0) {
          tempLabels.push(getLabel(stringRefs.current[item.id].value));
          item.label = (
            <span>
              <b>{item.title}</b>
              <br />
              <i>{getLabel(stringRefs.current[item.id].value)}</i> <br />
              Distance: {info.allDistances[index]} km
              <br />
              Time: {info.allTimes[index]} min
            </span>
          );
        }
        return item;
      });

      setLocationLabels(tempLabels);

      setTableData(info);
      if (isFuzzy) {
        setSchools(info.schools.splice(0, 6));
      }
      if (shouldHospital) {
        setHospitals(info.hospitals.splice(0, 2));
      }

      setZoom(15 - sliderValue);
      setAllCoordinates(info.allCoordinates);
      setAllCoordinates((previousState) => ({
        ...previousState,
        midpoint: info.midpoint,
      }));
      setMedPrice(info.median);
      setCenter(info.midpoint);
      setSubmitting(false);
      setSuccessMessage("Locations calculated successfully!");

      // Clear success message after configured duration
      setTimeout(() => setSuccessMessage(""), SUCCESS_MESSAGE_DURATION);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setError(
        error.message ||
        "Failed to calculate locations. Please check your internet connection and try again."
      );
      setSubmitting(false);
    }
    })();
    setShouldShowLocations(true);
  };

  // Debug utility removed for production

  const newMidpoint = (e) => {
    setSubmitting(true);
    const { latLng } = e;
    let data = {
      midpoint: {
        lat: latLng.lat(),
        lng: latLng.lng(),
      },
    };
    console.log(JSON.stringify(data));
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
    async function fetchFunc() {
      return await fetch("/newMidpoint", requestOpt)
        .then((response) => response.json())
        .catch((error) => console.log(error));
    }
    (async () => {
      let info = await fetchFunc();
      console.log(info);
      locations.map((item) => {
        let index = info.allCoordinates.findIndex(
          (coor) => coor[0] === item.coordinates.lat
        ); // makes sure to map the correct distance and times to the correct location
        if (index >= 0) {
          item.label = (
            <span>
              <b>{item.title}</b>
              <br />
              <i>{getLabel(stringRefs.current[item.id].value)}</i> <br />
              Distance: {info.allDistances[index]} km
              <br />
              Time: {info.allTimes[index]} min
            </span>
          );
        }
        return item;
      });

      if (isFuzzy) {
        setSchools(info.schools.splice(0, 6));
      }
      if (shouldHospital) {
        setHospitals(info.hospitals.splice(0, 2));
      }
      setMedPrice(info.median);
      setAllCoordinates(info.allCoordinates);
      setTableData(info);
      setSubmitting(false);
    })();
  };

  return (
    <div className="map">
      <LoadScript googleMapsApiKey={apiKey} libraries={MAPS_LIBRARIES}>
        <div className="locations">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠</span>
              {error}
              <button className="alert-close" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}
          {successMessage && (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              {successMessage}
            </div>
          )}
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
            </div>

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
              <div>Search for hospitals: </div>
              <div className="preference options">
                <label>Yes</label>
                <input
                  type="radio"
                  name="hospital"
                  onClick={() => setShouldHospital(true)}
                ></input>
                <label>No</label>
                <input
                  type="radio"
                  name="hospital"
                  onClick={() => setShouldHospital(false)}
                ></input>
              </div>
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

            {shouldShowLocations && tableData && (
              <div className="table output">
                <table className="table labels">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Distance (km)</th>
                      <th>Time (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationLabels.map((location, index) => {
                      return (
                        <tr key={index}>
                          <td>{location}</td>
                          <td>{tableData.allDistances[index]}</td>
                          <td>{tableData.allTimes[index]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {medPrice !== 0 && (
                  <span>Median price in neighbourhood: {medPrice}</span>
                )}
              </div>
            )}
            {shouldShowLocations && schools && (
              <div className="table output">
                <table className="table schools">
                  <thead>
                    <tr>
                      <th>Schools (nearest, ascending)</th>
                      {/* <th>Distance (kms)</th>
                      <th>Time(mins)</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((item, index) => {
                      return (
                        <tr key={index}>
                          <td>{item}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {shouldShowLocations && shouldHospital && hospitals && (
              <div className="table output">
                <table className="table labels">
                  <thead>
                    <tr>
                      <th>Hospitals (nearest, ascending)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitals.map((item, index) => {
                      return (
                        <tr key={index}>
                          <td>{item}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
          {submitting && <Spinner type="spinner" />}
        </div>

        <div className="googleMap">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
          >
            {shouldShowLocations && locations && (
              <div>
                {locations.map((item) => {
                  if (item.shouldShow) {
                    return (
                      <MarkerF
                        key={item.id}
                        title={item.id}
                        position={item.coordinates}
                        icon={
                          "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                        }
                        onClick={() => {
                          const tempArr = [...infoWindows];
                          tempArr[item.id] = true;
                          setInfoWindows(tempArr);
                        }}
                      >
                        {infoWindows[item.id] && (
                          <InfoWindowF
                            onCloseClick={() => {
                              const tempArr = [...infoWindows];
                              tempArr[item.id] = false;
                              setInfoWindows(tempArr);
                            }}
                          >
                            <div>{item.label}</div>
                          </InfoWindowF>
                        )}
                      </MarkerF>
                    );
                  }
                })}
              </div>
            )}
            {shouldShowMidPoint && (
              <CircleF
                center={allCoordinates.midpoint}
                radius={sliderValue * 1000}
                options={CIRCLE_OPTIONS}
                draggable={true}
                onDragEnd={(e) => newMidpoint(e)}
              />
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
}

Map.propTypes = {
  apiKey: PropTypes.string.isRequired,
};

export default Map;
