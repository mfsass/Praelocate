import React, { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import ReactSlider from "react-slider";
import Geocode from "react-geocode";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  CircleF,
  InfoWindowF,
} from "@react-google-maps/api";

import InputBox from "./InputBox";
import LoadingOverlay from "./LoadingOverlay";
import EmptyState from "./EmptyState";
import ConfirmDialog from "./ConfirmDialog";
import SettingsPanel from "./SettingsPanel";
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

function Map({ apiKey, toast }) {
  // Use the hook instead of LoadScript to prevent duplicate script loading
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
  });

  // Map reference for bounds fitting
  const mapRef = useRef(null);
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Initialize Geocode with the provided API key
  useEffect(() => {
    if (apiKey) {
      Geocode.setApiKey(apiKey);
      Geocode.setRegion("za");
    }
  }, [apiKey]);

  const titleRefs = useRef([]);
  const stringRefs = useRef([]);
  const timeRefs = useRef([]);
  const resultsRef = useRef(null);
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
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [userRegion, setUserRegion] = useState("za"); // Default to South Africa
  const [showSettings, setShowSettings] = useState(false);
  const locationDetectedRef = useRef(false);
  const [detectingLocation, setDetectingLocation] = useState(true); // For loading state

  const [submitting, setSubmitting] = useState(false);
  const [shouldShowLocations, setShouldShowLocations] = useState(false);
  const [shouldShowMidPoint, setShouldShowMidPoint] = useState(false);
  const [allCoordinates, setAllCoordinates] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [locationLabels, setLocationLabels] = useState([]);
  const [error, setError] = useState("");

  // Handle region change from settings
  const handleRegionChange = useCallback(
    (newRegion) => {
      setUserRegion(newRegion);
      Geocode.setRegion(newRegion);
      setShowSettings(false);
      toast?.success(`Region set to ${newRegion.toUpperCase()}`);
    },
    [toast]
  );

  // Get user's current location on mount (only once)
  useEffect(() => {
    // Prevent running multiple times
    if (locationDetectedRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (locationDetectedRef.current) return;
          locationDetectedRef.current = true;

          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userPos);
          setCenter(userPos);
          setLocationError(null);
          setDetectingLocation(false);

          // Try to detect region from coordinates
          if (window.google?.maps?.Geocoder) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: userPos }, (results, status) => {
              if (status === "OK" && results[0]) {
                const country = results[0].address_components.find((c) =>
                  c.types.includes("country")
                );
                if (country?.short_name) {
                  setUserRegion(country.short_name.toLowerCase());
                  Geocode.setRegion(country.short_name.toLowerCase());
                }
              }
            });
          }
        },
        (err) => {
          if (locationDetectedRef.current) return;
          locationDetectedRef.current = true;
          console.warn("Geolocation error:", err.message);
          setLocationError(
            "Could not get your location. Using default (South Africa)."
          );
          setDetectingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      locationDetectedRef.current = true;
      setLocationError("Geolocation not supported by browser");
      setDetectingLocation(false);
    }
  }, []);

  // Fit map bounds to show all locations
  const fitMapBounds = useCallback(() => {
    if (!mapRef.current || !isLoaded) return;

    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    // Add user location
    if (userLocation) {
      bounds.extend(userLocation);
      hasPoints = true;
    }

    // Add all valid location markers
    locations.forEach((loc) => {
      if (
        loc.shouldShow &&
        loc.coordinates.lat !== 0 &&
        loc.coordinates.lng !== 0
      ) {
        bounds.extend(loc.coordinates);
        hasPoints = true;
      }
    });

    // Add midpoint if available
    if (allCoordinates.midpoint) {
      bounds.extend(allCoordinates.midpoint);
      hasPoints = true;
    }

    if (hasPoints) {
      mapRef.current.fitBounds(bounds, { padding: 50 });
      // Don't zoom in too far for single point
      const listener = mapRef.current.addListener("idle", () => {
        if (mapRef.current.getZoom() > 15) {
          mapRef.current.setZoom(15);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  }, [isLoaded, userLocation, locations, allCoordinates.midpoint]);

  // Auto-fit bounds when locations change
  useEffect(() => {
    if (locations.some((loc) => loc.shouldShow)) {
      fitMapBounds();
    }
  }, [locations, fitMapBounds]);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    locationIndex: null,
  });

  // Delete location handler
  const handleDeleteLocation = useCallback((index) => {
    setConfirmDialog({ isOpen: true, locationIndex: index });
  }, []);

  // Save individual location handler
  const handleSaveLocation = useCallback(
    async (index) => {
      const stringRef = stringRefs.current[index];
      const titleRef = titleRefs.current[index];
      const timeRef = timeRefs.current[index];

      if (!stringRef?.value) {
        toast?.warning("Please enter an address first");
        return false;
      }

      try {
        const response = await Geocode.fromAddress(stringRef.value);
        if (!response.results || response.results.length === 0) {
          toast?.error("Could not find that address");
          return false;
        }

        const coordinates = response.results[0].geometry.location;
        const label =
          stringRef.value.substring(0, stringRef.value.indexOf(",")) ||
          stringRef.value;
        const timeValue = timeRef?.value || "12:00";
        const tempLocation = {
          id: index,
          coordinates: coordinates,
          label: label,
          shouldShow: true,
          rank: ranks[index] > 0 ? ranks[index] : 1,
          time: timeValue,
          title: titleRef?.value || `Location ${index + 1}`,
        };

        setLocations((prev) =>
          prev.map((item, i) => (i === index ? tempLocation : item))
        );

        toast?.success(`Location "${tempLocation.title}" saved`);

        // Fit bounds after a short delay to allow state to update
        setTimeout(() => {
          if (mapRef.current && window.google?.maps) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(coordinates);
            if (userLocation) bounds.extend(userLocation);
            mapRef.current.fitBounds(bounds, { padding: 50 });
          }
        }, 100);

        return true;
      } catch (error) {
        console.error("Error saving location:", error);
        toast?.error(
          "Failed to save location. Check the address and try again."
        );
        return false;
      }
    },
    [ranks, toast, userLocation]
  );

  const confirmDeleteLocation = useCallback(() => {
    const index = confirmDialog.locationIndex;
    setLocations((prev) => prev.filter((_, i) => i !== index));
    setInputs((prev) => prev.filter((_, i) => i !== index));
    setInfoWindows((prev) => prev.filter((_, i) => i !== index));
    setConfirmDialog({ isOpen: false, locationIndex: null });
    toast?.success("Location removed");
  }, [confirmDialog.locationIndex, toast]);

  const toggleShow = (event) => {
    if (allCoordinates.midpoint) {
      setShouldShowMidPoint((shouldShowMidPoint) => !shouldShowMidPoint);
      changeColor(event, "#236F74");
    } else {
      toast?.warning("Please submit locations first to show the midpoint");
    }
  };

  const changeColor = (event, color) => {
    let tempColor = color ? color : "#236F74";
    event.target.style["background-color"] = tempColor;
  };

  // Add location with validation
  const addInput = useCallback(() => {
    if (locations.length >= MAX_LOCATIONS) {
      toast?.warning(`Maximum ${MAX_LOCATIONS} locations allowed`);
      return;
    }
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
    // Capture the current count for this specific location
    const newIndex = count;

    let lastTitleRef = (ref0) => (titleRefs.current[newIndex] = ref0);
    let lastStringRef = (ref1) => (stringRefs.current[newIndex] = ref1);
    let lastTimeRef = (ref2) => (timeRefs.current[newIndex] = ref2);

    setInputs((state) => [
      ...state,
      <InputBox
        key={newIndex}
        ref={{
          locationTitle: lastTitleRef,
          locationStr: lastStringRef,
          locationTime: lastTimeRef,
        }}
        changeRank={changeRank}
        name={newIndex}
        setIsFuzzy={setIsFuzzy}
        onDelete={() => handleDeleteLocation(newIndex)}
        onSave={() => handleSaveLocation(newIndex)}
        autoExpand={true}
        region={userRegion}
      />,
    ]);

    setInfoWindows([...infoWindows, false]);

    setCount(count + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, infoWindows, toast, handleDeleteLocation, userRegion]);

  /*
    Called by the child
    !** important **! does not have the state of the parent
  */
  const changeRank = useCallback((index, value) => {
    setRanks((prevRanks) =>
      prevRanks.map((item, i) => (i === index ? value : item))
    );
  }, []);

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

      getGeoFromText(string.value, index)
        .then((response) => {
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
        })
        .catch((error) => {
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
        setError(
          `Failed to geocode location: "${text}". Please check the address and try again.`
        );
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

    // Filter to only locations that have been saved (shouldShow = true)
    const validLocations = tempLocations.filter(
      (loc) => loc.shouldShow && loc.coordinates.lat !== 0
    );

    if (validLocations.length < 2) {
      setError(
        "Please add and save at least 2 locations to find an optimal midpoint."
      );
      toast?.warning("You need at least 2 saved locations");
      setSubmitting(false);
      return;
    }

    let data = {
      locations: validLocations,
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

        locations.forEach((item) => {
          let index = info.allCoordinates.findIndex(
            (coor) => coor[0] === item.coordinates.lat
          ); // makes sure to map the correct distance and times to the correct location
          if (index >= 0) {
            // Safely get the label from ref or use the stored label
            const refValue = stringRefs.current[item.id]?.value;
            const label = refValue
              ? getLabel(refValue)
              : item.label || `Location ${item.id + 1}`;
            tempLabels.push(label);
            item.label = (
              <span>
                <b>{item.title || `Location ${item.id + 1}`}</b>
                <br />
                <i>{label}</i> <br />
                Distance: {info.allDistances[index]} km
                <br />
                Time: {info.allTimes[index]} min
              </span>
            );
          }
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

        // Scroll to results after a short delay
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);

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

  // Handle loading and error states
  if (loadError) {
    return (
      <div className="map">
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          Failed to load Google Maps. Please check your API key and try again.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map">
        <LoadingOverlay
          isVisible={true}
          type="spinner"
          message="Loading Google Maps..."
        />
      </div>
    );
  }

  return (
    <>
      <div className="map">
        <div className="locations">
          {/* Header with settings */}
          <div className="locations-header">
            <h2 className="locations-title">📍 Find Your Midpoint</h2>
            <button
              type="button"
              className="settings-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              title="Change region settings"
            >
              ⚙️
            </button>
          </div>

          {/* Location detection status */}
          {locationError && (
            <div className="alert alert-error" style={{ marginBottom: "10px" }}>
              <span className="alert-icon">📍</span>
              {locationError}
              <button
                className="alert-close"
                onClick={() => setLocationError(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

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
            {inputs.length === 0 ? (
              <EmptyState
                icon="🏠"
                title="No locations added yet"
                description="Add your important locations like work, school, or gym to find the perfect home location"
                action={addInput}
                actionLabel="Add First Location"
              />
            ) : (
              inputs.map((input, index) => {
                return (
                  <div className="box" key={index}>
                    {input}
                  </div>
                );
              })
            )}
            <div className="locations add">
              <label id="add-location-label">Add a location</label>
              <button
                type="button"
                onClick={addInput}
                aria-label="Add new location"
                aria-describedby="add-location-label"
                className={inputs.length >= MAX_LOCATIONS ? "disabled" : ""}
                disabled={inputs.length >= MAX_LOCATIONS}
              >
                +
              </button>
            </div>

            <div className="locations slider">
              <label htmlFor="radius-slider" id="radius-label">
                Output radius:
              </label>

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
                ariaLabel="Select search radius in kilometers"
                ariaValueText={`${sliderValue} kilometers`}
              />

              <div aria-live="polite" aria-atomic="true">
                {sliderValue} km
              </div>
            </div>

            <div className="locations preference">
              <fieldset>
                <legend>Search for hospitals:</legend>
                <div className="preference options">
                  <label htmlFor="hospital-yes">
                    <input
                      id="hospital-yes"
                      type="radio"
                      name="hospital"
                      onClick={() => setShouldHospital(true)}
                      aria-label="Include hospitals in search"
                    />
                    Yes
                  </label>
                  <label htmlFor="hospital-no">
                    <input
                      id="hospital-no"
                      type="radio"
                      name="hospital"
                      onClick={() => setShouldHospital(false)}
                      aria-label="Do not include hospitals"
                    />
                    No
                  </label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Calculation preference:</legend>
                <div className="preference options">
                  <label htmlFor="pref-distance">
                    <input
                      id="pref-distance"
                      type="radio"
                      name="preference"
                      onClick={() => setPreference("distance")}
                      aria-label="Optimize for distance"
                    />
                    Distance
                  </label>
                  <label htmlFor="pref-time">
                    <input
                      id="pref-time"
                      type="radio"
                      name="preference"
                      onClick={() => setPreference("time")}
                      aria-label="Optimize for time"
                    />
                    Time
                  </label>
                </div>
              </fieldset>
            </div>

            {shouldShowLocations && tableData && (
              <div className="results-section" ref={resultsRef}>
                <h3 className="results-title">📍 Results</h3>
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
                </div>

                {medPrice !== 0 && (
                  <div className="median-price-info">
                    <span>Median price in neighbourhood: {medPrice}</span>
                  </div>
                )}

                {schools && schools.length > 0 && (
                  <div className="table output">
                    <table className="table schools">
                      <thead>
                        <tr>
                          <th>Schools (nearest, ascending)</th>
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

                {shouldHospital && hospitals && hospitals.length > 0 && (
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
              </div>
            )}

            <div className="box button">
              <button
                className="locations button submit-btn"
                type="submit"
                onClick={changeColor}
                aria-label="Calculate optimal location"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Calculating...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🎯</span>
                    Find Optimal Location
                  </>
                )}
              </button>
              <button
                className="locations button secondary-btn"
                type="button"
                onClick={toggleShow}
                aria-label="Toggle midpoint visibility on map"
                aria-pressed={shouldShowMidPoint}
              >
                <span className="btn-icon">
                  {shouldShowMidPoint ? "👁️" : "📍"}
                </span>
                {shouldShowMidPoint ? "Hide Point" : "Show Point"}
              </button>
            </div>
          </form>
        </div>

        {/* Loading Overlays */}
        <LoadingOverlay
          isVisible={detectingLocation}
          type="pulse"
          message="Finding your location..."
          subMessage="This helps us provide better search results"
        />
        <LoadingOverlay
          isVisible={submitting}
          type="thinking"
          message="Calculating optimal location..."
          subMessage="Analyzing distances and travel times"
        />

        <div className="googleMap">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={zoom}
            onLoad={onMapLoad}
            options={{
              styles:
                document.documentElement.getAttribute("data-theme") === "dark"
                  ? [
                      {
                        elementType: "geometry",
                        stylers: [{ color: "#242f3e" }],
                      },
                      {
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#242f3e" }],
                      },
                      {
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#746855" }],
                      },
                      {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                      },
                      {
                        featureType: "water",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#515c6d" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#38414e" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#212a37" }],
                      },
                      {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                      },
                    ]
                  : [],
            }}
          >
            {/* User location marker */}
            {userLocation && (
              <MarkerF
                position={userLocation}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 10,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 3,
                }}
                title="Your location"
                zIndex={1000}
              />
            )}

            {/* Location markers - always show valid locations */}
            {locations &&
              locations.map((item) => {
                if (
                  item.shouldShow &&
                  item.coordinates.lat !== 0 &&
                  item.coordinates.lng !== 0
                ) {
                  return (
                    <MarkerF
                      key={item.id}
                      title={item.title || `Location ${item.id + 1}`}
                      position={item.coordinates}
                      icon={{
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        scaledSize: new window.google.maps.Size(40, 40),
                      }}
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
                          <div className="info-window-content">
                            <h4
                              style={{ margin: "0 0 4px 0", color: "#1a1a1a" }}
                            >
                              {item.title || `Location ${item.id + 1}`}
                            </h4>
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "12px",
                                color: "#555",
                              }}
                            >
                              {item.label}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "11px",
                                color: "#888",
                              }}
                            >
                              Time: {item.time} | Importance: {item.rank}/4
                            </p>
                          </div>
                        </InfoWindowF>
                      )}
                    </MarkerF>
                  );
                }
                return null;
              })}

            {/* Midpoint circle */}
            {shouldShowMidPoint && allCoordinates.midpoint && (
              <>
                <CircleF
                  center={allCoordinates.midpoint}
                  radius={sliderValue * 1000}
                  options={CIRCLE_OPTIONS}
                  draggable={true}
                  onDragEnd={(e) => newMidpoint(e)}
                />
                <MarkerF
                  position={allCoordinates.midpoint}
                  icon={{
                    url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    scaledSize: new window.google.maps.Size(48, 48),
                  }}
                  title="Optimal midpoint"
                  onClick={() => {
                    toast?.info(
                      `Midpoint: ${allCoordinates.midpoint.lat.toFixed(
                        4
                      )}, ${allCoordinates.midpoint.lng.toFixed(4)}`
                    );
                  }}
                />
              </>
            )}
          </GoogleMap>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Remove Location"
        message="Are you sure you want to remove this location? This action cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmDeleteLocation}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, locationIndex: null })
        }
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        region={userRegion}
        onRegionChange={handleRegionChange}
      />
    </>
  );
}

Map.propTypes = {
  apiKey: PropTypes.string.isRequired,
  toast: PropTypes.shape({
    success: PropTypes.func,
    error: PropTypes.func,
    warning: PropTypes.func,
    info: PropTypes.func,
  }),
};

export default Map;
