import React, {
  forwardRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";

import { StandaloneSearchBox } from "@react-google-maps/api";
import { RANK_LABELS } from "../constants";

import "./inputBox.css";

// Region bounds for biasing search results
const REGION_BOUNDS = {
  za: { north: -22.0, south: -35.0, east: 33.0, west: 16.0 }, // South Africa
  us: { north: 49.0, south: 24.0, east: -66.0, west: -125.0 }, // United States
  gb: { north: 61.0, south: 49.0, east: 2.0, west: -8.0 }, // United Kingdom
  au: { north: -10.0, south: -44.0, east: 154.0, west: 113.0 }, // Australia
  ca: { north: 83.0, south: 41.0, east: -52.0, west: -141.0 }, // Canada
  de: { north: 55.0, south: 47.0, east: 15.0, west: 5.0 }, // Germany
  fr: { north: 51.0, south: 41.0, east: 10.0, west: -5.0 }, // France
  nl: { north: 54.0, south: 50.0, east: 7.5, west: 3.0 }, // Netherlands
  nz: { north: -34.0, south: -47.5, east: 179.0, west: 166.0 }, // New Zealand
  in: { north: 35.0, south: 6.0, east: 97.0, west: 68.0 }, // India
};

/**
 * InputBox Component
 * Renders a location input with title, address search, importance rating, and arrival time.
 */
const InputBox = forwardRef(
  (
    {
      changeRank,
      name,
      setIsFuzzy,
      onDelete,
      onSave,
      autoExpand = false,
      region = "za",
    },
    ref
  ) => {
    const [rankText, setRankText] = useState(RANK_LABELS[0]);
    const [shouldShow, setShouldShow] = useState(autoExpand);
    const [fuzzy, setFuzzy] = useState(false);
    const [title, setTitle] = useState("");
    const [rank, setRank] = useState(0);
    const [isExpanded, setIsExpanded] = useState(autoExpand);
    const [isSaved, setIsSaved] = useState(false);

    const { locationTitle, locationStr, locationTime } = ref;

    // Create bounds for the selected region to bias search results
    const searchBoxBounds = useMemo(() => {
      const bounds = REGION_BOUNDS[region] || REGION_BOUNDS.za;
      return bounds;
    }, [region]);

    // Update rank text based on rank value using constants
    useEffect(() => {
      setRankText(RANK_LABELS[rank] || RANK_LABELS[0]);
    }, [rank]);

    const handleToggle = useCallback(() => {
      setShouldShow((prev) => !prev);
      setIsExpanded((prev) => !prev);
      if (shouldShow) {
        setFuzzy(false);
      }
    }, [shouldShow]);

    const handleRankChange = useCallback(
      (value) => {
        changeRank(name, value);
        setRank(value);
      },
      [changeRank, name]
    );

    const handleFuzzyToggle = useCallback(() => {
      setIsFuzzy(!fuzzy);
      setFuzzy(!fuzzy);
    }, [fuzzy, setIsFuzzy]);

    const handleSave = useCallback(async () => {
      if (onSave) {
        const success = await onSave();
        if (success) {
          setIsSaved(true);
          setShouldShow(false);
          setIsExpanded(false);
        }
      }
    }, [onSave]);

    return (
      <div
        className={`input-box ${isExpanded ? "expanded" : ""} ${
          isSaved ? "saved" : ""
        }`}
      >
        <div className="input-box-header">
          <div className="input-box-title-row">
            {isSaved && (
              <span className="saved-indicator" title="Location saved">
                ✓
              </span>
            )}
            <input
              className="input-title"
              type="text"
              ref={locationTitle}
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="Enter location name..."
              aria-label="Location title"
            />
            <div className="input-box-actions">
              <button
                type="button"
                className={`expand-toggle ${shouldShow ? "active" : ""}`}
                onClick={handleToggle}
                aria-expanded={shouldShow}
                aria-label={
                  shouldShow
                    ? "Collapse location details"
                    : "Expand location details"
                }
                title={shouldShow ? "Collapse" : "Expand"}
              >
                {shouldShow ? "▼" : "▶"}
              </button>
              {onDelete && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={onDelete}
                  aria-label="Remove this location"
                  title="Remove location"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {shouldShow && (
          <div className="input-box-content">
            <div className="input-field-group">
              <label className="input-label">Address</label>
              <StandaloneSearchBox bounds={searchBoxBounds}>
                <input
                  ref={locationStr}
                  type="text"
                  className="input-address"
                  placeholder="Search for an address..."
                  readOnly={fuzzy}
                  aria-label="Location address"
                />
              </StandaloneSearchBox>
            </div>

            {title.toLowerCase().includes("school") && (
              <div className="fuzzy-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={fuzzy}
                    onChange={handleFuzzyToggle}
                    aria-describedby="fuzzy-description"
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">
                    Find nearby schools for me
                  </span>
                </label>
                <small id="fuzzy-description" className="field-hint">
                  We&apos;ll search for the best schools in your preferred area
                </small>
              </div>
            )}

            <div className="importance-rating">
              <label className="input-label">
                How important is this location?
              </label>
              <div
                className="rating-buttons"
                role="radiogroup"
                aria-label="Importance rating"
              >
                {[4, 3, 2, 1].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rating-btn ${rank === value ? "active" : ""}`}
                    onClick={() => handleRankChange(value)}
                    aria-pressed={rank === value}
                    title={RANK_LABELS[value]}
                  >
                    <span
                      className="rating-bar"
                      style={{ height: `${value * 25}%` }}
                    />
                  </button>
                ))}
                <span className="rating-text">{rankText}</span>
              </div>
            </div>

            <div className="time-input-group">
              <label htmlFor={`arrival-time-${name}`} className="input-label">
                Arrival Time
              </label>
              <input
                type="time"
                id={`arrival-time-${name}`}
                ref={locationTime}
                className="input-time"
                defaultValue="08:00"
                aria-label="Preferred arrival time"
              />
              <small className="field-hint">
                When do you need to arrive here?
              </small>
            </div>

            {onSave && (
              <div className="input-box-footer">
                <button
                  type="button"
                  className={`save-location-btn ${isSaved ? "saved" : ""}`}
                  onClick={handleSave}
                  disabled={isSaved}
                >
                  {isSaved ? "✓ Saved" : "Save Location"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

InputBox.displayName = "InputBox";

InputBox.propTypes = {
  changeRank: PropTypes.func.isRequired,
  name: PropTypes.number.isRequired,
  setIsFuzzy: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  onSave: PropTypes.func,
  autoExpand: PropTypes.bool,
  region: PropTypes.string,
};

export default InputBox;
