/**
 * Constants for Praelocate application
 */

// Rank labels for location importance
export const RANK_LABELS = {
  0: "Importance",
  1: "Not important",
  2: "Important",
  3: "Very important",
  4: "Integral",
};

// Default map center (Cape Town, South Africa)
export const DEFAULT_MAP_CENTER = {
  lat: -33.9328,
  lng: 18.8644,
};

// Default map zoom level
export const DEFAULT_ZOOM = 14;

// Map circle styling options
export const CIRCLE_OPTIONS = {
  strokeColor: "#5982E2",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#5982E2",
  fillOpacity: 0.35,
};

// Default location time
export const DEFAULT_TIME = "12:00";

// Maximum number of locations (configurable)
export const MAX_LOCATIONS = 20;

// Message display duration
export const SUCCESS_MESSAGE_DURATION = 3000; // 3 seconds

// Default preferences
export const DEFAULT_PREFERENCES = {
  time: "time",
  distance: "distance",
};

// Validation constants
export const API_KEY_MIN_LENGTH = 20;

// Google Maps libraries to load
export const MAPS_LIBRARIES = ["places"];
