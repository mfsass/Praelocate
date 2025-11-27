"""
Praelocate Backend API
======================
Flask API for calculating optimal meeting points based on multiple locations,
with integration for schools, hospitals, and property price data.
"""

import logging
import os
import sys
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, List, Optional, Tuple, Any

import googlemaps
import math
import requests
from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS

# Selenium imports for web scraping (property prices)
try:
    from selenium import webdriver
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.chrome.options import Options
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
def setup_logging():
    """Configure application logging with both file and console handlers."""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Create logger
    logger = logging.getLogger('praelocate')
    logger.setLevel(logging.DEBUG)
    
    # Console handler (INFO level)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # File handler (DEBUG level) - logs everything
    try:
        file_handler = logging.FileHandler('praelocate.log', encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter(log_format))
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Warning: Could not create log file: {e}")
    
    logger.addHandler(console_handler)
    return logger

logger = setup_logging()

# =============================================================================
# API ERROR CLASSES
# =============================================================================
class APIError(Exception):
    """Base exception for API errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class ValidationError(APIError):
    """Raised when request validation fails."""
    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(message, status_code=400, details=details)

class ExternalServiceError(APIError):
    """Raised when an external service (Google Maps, etc.) fails."""
    def __init__(self, message: str, service: str, details: Optional[Dict] = None):
        super().__init__(message, status_code=502, details=details)
        self.service = service

# =============================================================================
# FLASK APP INITIALIZATION
# =============================================================================
app = Flask(__name__)
CORS(app)

# =============================================================================
# API KEY LOADING
# =============================================================================
def load_api_key() -> str:
    """
    Load Google Maps API key from file or environment variable.
    
    Returns:
        str: The API key
        
    Raises:
        SystemExit: If API key cannot be loaded
    """
    # Try environment variable first
    key = os.environ.get('GOOGLE_MAPS_API_KEY')
    if key:
        logger.info("API key loaded from environment variable")
        return key.strip()
    
    # Fall back to file
    api_key_file = 'api-key.txt'
    try:
        with open(api_key_file, 'r') as f:
            key = f.readline().strip()
            if not key:
                logger.error("API key file is empty")
                raise ValueError("API key file is empty")
            logger.info("API key loaded from file")
            return key
    except FileNotFoundError:
        logger.error(f"API key file '{api_key_file}' not found")
        logger.info("Set GOOGLE_MAPS_API_KEY environment variable or create api-key.txt")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error reading API key: {e}")
        sys.exit(1)

# Load API key
key = load_api_key()

# Initialize Google Maps client
try:
    gmaps = googlemaps.Client(key=key)
    logger.info("Google Maps client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Google Maps client: {e}")
    sys.exit(1)


# =============================================================================
# GLOBAL STATE (Consider refactoring to class-based approach)
# =============================================================================
coordinates: List[Tuple[float, float]] = []
all_coordinates: Dict = {}
midpoint: Dict = {}
all_ranks: List[float] = []
times: List[str] = []
radius: float = 0.0
optimize_preference: str = "time"
isFuzzy: bool = False
index: int = 0

# =============================================================================
# ERROR HANDLING DECORATORS
# =============================================================================
def handle_errors(f):
    """Decorator to handle exceptions and return proper JSON error responses."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValidationError as e:
            logger.warning(f"Validation error: {e.message}", extra={'details': e.details})
            return jsonify({
                'error': 'Validation Error',
                'message': e.message,
                'details': e.details
            }), e.status_code
        except ExternalServiceError as e:
            logger.error(f"External service error ({e.service}): {e.message}")
            return jsonify({
                'error': 'External Service Error',
                'message': e.message,
                'service': e.service,
                'details': e.details
            }), e.status_code
        except APIError as e:
            logger.error(f"API error: {e.message}")
            return jsonify({
                'error': 'API Error',
                'message': e.message,
                'details': e.details
            }), e.status_code
        except Exception as e:
            logger.exception(f"Unexpected error: {str(e)}")
            return jsonify({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred. Please try again later.',
                'debug': str(e) if app.debug else None
            }), 500
    return decorated_function

# =============================================================================
# VALIDATION HELPERS
# =============================================================================
def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate latitude and longitude values."""
    return -90 <= lat <= 90 and -180 <= lng <= 180

def validate_location_data(data: Dict) -> None:
    """
    Validate incoming location request data.
    
    Args:
        data: Request JSON data
        
    Raises:
        ValidationError: If validation fails
    """
    if not data:
        raise ValidationError("Request body is required")
    
    if 'locations' not in data:
        raise ValidationError("'locations' field is required")
    
    locations = data['locations']
    if not isinstance(locations, list):
        raise ValidationError("'locations' must be an array")
    
    if len(locations) < 2:
        raise ValidationError("At least 2 locations are required to calculate a midpoint", {'min_locations': 2})
    
    if len(locations) > 10:
        raise ValidationError("Maximum 10 locations allowed", {'max_locations': 10})
    
    for i, loc in enumerate(locations):
        if 'coordinates' not in loc:
            raise ValidationError(f"Location {i+1}: 'coordinates' field is required")
        
        coords = loc['coordinates']
        try:
            lat = float(coords.get('lat', 0))
            lng = float(coords.get('lng', 0))
        except (ValueError, TypeError):
            raise ValidationError(f"Location {i+1}: Invalid coordinate values")
        
        if not validate_coordinates(lat, lng):
            raise ValidationError(f"Location {i+1}: Coordinates out of valid range")
        
        if 'rank' not in loc:
            raise ValidationError(f"Location {i+1}: 'rank' field is required")
        
        if 'time' not in loc:
            raise ValidationError(f"Location {i+1}: 'time' field is required")

# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================
@app.route("/health", methods=["GET"])
@cross_origin()
def health_check():
    """Health check endpoint for monitoring."""
    from datetime import timezone
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': '1.0.0'
    })

# =============================================================================
# API ROUTES
# =============================================================================
@app.route("/newMidpoint", methods=["POST"])
@cross_origin()
@handle_errors
def new_midpoint():
    """
    Recalculate distances and times from a new midpoint to all coordinates.
    
    Expected JSON body:
        {
            "midpoint": {"lat": float, "lng": float}
        }
    
    Returns:
        JSON with updated distances, times, schools, hospitals, and median price.
    """
    data = request.get_json()
    
    if not data or 'midpoint' not in data:
        raise ValidationError("'midpoint' field is required")
    
    midpoint_data = data['midpoint']
    try:
        origin_tuple = (
            float(midpoint_data['lat']),
            float(midpoint_data['lng']),
        )
    except (KeyError, ValueError, TypeError) as e:
        raise ValidationError(f"Invalid midpoint coordinates: {e}")
    
    if not validate_coordinates(origin_tuple[0], origin_tuple[1]):
        raise ValidationError("Midpoint coordinates out of valid range")
    
    logger.info(f"Calculating new midpoint distances from {origin_tuple}")
    
    list_distances = []
    list_times = []

    for i in range(len(coordinates)):
        time_str = times[i]
        try:
            time_object = datetime.strptime(time_str, "%H:%M").time()
            time_object = datetime.combine(
                datetime.today() + timedelta(days=1), time_object
            )
        except ValueError as e:
            logger.warning(f"Invalid time format for location {i}: {time_str}")
            raise ValidationError(f"Invalid time format: {time_str}")

        try:
            result = gmaps.directions(
                origin=origin_tuple,
                destination=(coordinates[i][0], coordinates[i][1]),
                mode="driving",
                departure_time=time_object,
            )
        except Exception as e:
            logger.error(f"Google Maps API error: {e}")
            raise ExternalServiceError(
                "Failed to get directions from Google Maps",
                service="Google Maps API",
                details={'error': str(e)}
            )

        if not result:
            raise ExternalServiceError(
                "No route found between points",
                service="Google Maps API"
            )

        distance = int(result[0]["legs"][0]["distance"]["value"])
        duration = int(
            result[0]["legs"][0]["duration_in_traffic"]["value"]
        )

        list_distances.append(round((distance / 1000), 2))
        list_times.append(round((duration / 60), 2))

    logger.info(f"Calculated distances: {list_distances}")
    logger.info(f"Calculated times: {list_times}")

    # Get nearby amenities
    list_schools = fuzzy_schools(origin_tuple)
    list_hospitals = fuzzy_hospitals(origin_tuple)
    average_price = find_suburb(origin_tuple)
    
    logger.info(f"Median price: {average_price}")

    return jsonify({
        "allCoordinates": coordinates,
        "allDistances": list_distances,
        "allTimes": list_times,
        "schools": list_schools,
        "hospitals": list_hospitals,
        "median": average_price,
    })


@app.route("/locations", methods=["POST"])
@cross_origin()
@handle_errors
def locations():
    """
    Calculate optimal midpoint for multiple locations.
    
    Expected JSON body:
        {
            "locations": [
                {
                    "coordinates": {"lat": float, "lng": float},
                    "rank": int (1-5),
                    "time": "HH:MM"
                }
            ],
            "radius": float (km),
            "preference": "time" | "distance",
            "isFuzzy": "true" | "false"
        }
    
    Returns:
        JSON with optimal midpoint, distances, times, and nearby amenities.
    """
    global coordinates, all_coordinates, midpoint, all_ranks, times
    global radius, optimize_preference, isFuzzy

    # Reset state
    coordinates = []
    all_coordinates = {}
    midpoint = {}
    all_ranks = []
    times = []

    data = request.get_json()
    
    # Validate request
    validate_location_data(data)
    
    # Extract parameters with defaults
    radius = float(data.get("radius", 5.0))
    optimize_preference = data.get("preference", "time")
    isFuzzy = str(data.get("isFuzzy", "false")).lower() == "true"
    
    if optimize_preference not in ["time", "distance"]:
        raise ValidationError(
            "Invalid preference value",
            {'allowed_values': ['time', 'distance']}
        )
    
    logger.info(f"Processing {len(data['locations'])} locations with radius={radius}km, optimize={optimize_preference}")

    list_json = []
    for location in data["locations"]:
        try:
            lat = float(location["coordinates"]["lat"])
            lng = float(location["coordinates"]["lng"])
            rank = float(location["rank"])
            time_val = str(location["time"])
            
            # Skip invalid locations (rank <= 0 or coordinates at 0,0)
            if rank <= 0:
                logger.debug(f"Skipping location with invalid rank: {rank}")
                continue
            if lat == 0 and lng == 0:
                logger.debug(f"Skipping location with null coordinates (0,0)")
                continue
            
            item = (lat, lng, rank, time_val)
            list_json.append(item)
        except (KeyError, ValueError, TypeError) as e:
            raise ValidationError(f"Invalid location data: {e}")

    # Ensure we have at least one valid location
    if len(list_json) == 0:
        raise ValidationError("No valid locations provided. Ensure at least one location has valid coordinates and rank > 0.")

    logger.debug(f"Parsed {len(list_json)} valid locations: {list_json}")

    return calculate_midpoint(list_json)


# =============================================================================
# MIDPOINT CALCULATION
# =============================================================================
# Earth radius in kilometers
EARTH_RADIUS_KM = 6378.0
DEGREES_TO_RADIANS = math.pi / 180.0
RADIANS_TO_DEGREES = 180.0 / math.pi

def calculate_midpoint(list_json: List[Tuple]) -> Dict[str, Any]:
    """
    Calculate the optimal midpoint for given locations.
    
    Args:
        list_json: List of tuples (lat, lng, rank, time)
        
    Returns:
        Dict containing midpoint, distances, times, and nearby amenities.
    """
    global index
    
    # Extract data from input
    for item in list_json:
        all_ranks.append(item[2])
        coordinates.append((item[0], item[1]))
        times.append(item[3])

    # Calculate weighted center
    midpoint_lat = 0.0
    midpoint_lng = 0.0
    total_weight = 0.0

    for i, coord in enumerate(coordinates):
        weight = all_ranks[i]
        # Only include positive weights
        if weight > 0:
            midpoint_lat += coord[0] * weight
            midpoint_lng += coord[1] * weight
            total_weight += weight

    # Safety check for zero weight (should not happen after validation)
    if total_weight == 0:
        logger.error("Total weight is zero - no valid locations with positive ranks")
        raise ValidationError("Cannot calculate midpoint: no valid locations with positive importance")

    midpoint_lat /= total_weight
    midpoint_lng /= total_weight
    midpoint = {"lat": midpoint_lat, "lng": midpoint_lng}
    
    logger.info(f"Calculated weighted midpoint: {midpoint}")

    # Calculate offset coordinates for optimization
    radius_km = radius
    latitude_degrees = (radius_km / EARTH_RADIUS_KM) * RADIANS_TO_DEGREES
    r = EARTH_RADIUS_KM * math.cos(midpoint_lat * DEGREES_TO_RADIANS)
    longitude_degrees = (radius_km / r) * RADIANS_TO_DEGREES

    # Create array of candidate points (center + 4 cardinal directions)
    candidate_points = [
        midpoint,
        {"lat": midpoint_lat, "lng": midpoint_lng + longitude_degrees},  # East
        {"lat": midpoint_lat, "lng": midpoint_lng - longitude_degrees},  # West
        {"lat": midpoint_lat + latitude_degrees, "lng": midpoint_lng},   # North
        {"lat": midpoint_lat - latitude_degrees, "lng": midpoint_lng},   # South
    ]
    
    results = []

    # Calculate distances and times for each candidate point
    for j, candidate in enumerate(candidate_points):
        all_distance = []
        all_time = []
        
        try:
            average_distance = 0
            average_time = 0
            multiplier_sum = 0
            weighted_time_sum = 0

            origin_tuple = (candidate["lat"], candidate["lng"])
            
            logger.debug(f"Processing candidate point {j}: {origin_tuple}")

            for i in range(len(list_json)):
                time_str = times[i]
                try:
                    time_object = datetime.strptime(time_str, "%H:%M").time()
                    time_object = datetime.combine(
                        datetime.today() + timedelta(days=1), time_object
                    )
                except ValueError:
                    logger.warning(f"Invalid time format: {time_str}, using default")
                    time_object = datetime.now() + timedelta(days=1)

                try:
                    directions_result = gmaps.directions(
                        origin=origin_tuple,
                        destination=(coordinates[i][0], coordinates[i][1]),
                        mode="driving",
                        departure_time=time_object,
                    )
                except Exception as e:
                    logger.error(f"Google Maps API error for point {j}: {e}")
                    raise ExternalServiceError(
                        "Google Maps API request failed",
                        service="Google Maps API",
                        details={'error': str(e)}
                    )
                
                if len(directions_result) == 0:
                    logger.warning("No route found - possible rate limiting")
                    raise ExternalServiceError(
                        "Too many requests - please wait and try again",
                        service="Google Maps API"
                    )

                distance = int(directions_result[0]["legs"][0]["distance"]["value"])
                duration = int(
                    directions_result[0]["legs"][0]["duration_in_traffic"]["value"]
                )

                all_distance.append(round(distance / 1000, 2))
                all_time.append(round(duration / 60, 2))
                average_distance += distance
                average_time += duration

                # Weight calculation: higher rank = lower multiplier (more important)
                multiplier = (all_ranks[i] * -0.2) + 1.5
                multiplier_sum += multiplier
                weighted_time_sum += multiplier * duration

            # Calculate averages
            num_locations = len(list_json)
            average_distance = round(average_distance / (1000 * num_locations), 2)
            average_time = round(average_time / (num_locations * 60), 2)
            average_time_weighted = round(weighted_time_sum / (multiplier_sum * 60), 2)

            results.append({
                'average_distance': average_distance,
                'average_time': average_time,
                'all_distances': all_distance,
                'all_times': all_time,
                'weighted_time': average_time_weighted,
                'origin': origin_tuple,
            })

        except ExternalServiceError:
            raise
        except Exception as e:
            logger.error(f"Error calculating for candidate {j}: {e}")
            raise APIError(f"Calculation error: {str(e)}")

    # Find optimal location based on preference
    index = 0
    optimized = results[0]
    
    if optimize_preference == "time":
        min_value = sum(results[0]['all_times'])
        for k, result in enumerate(results[1:], start=1):
            total_time = sum(result['all_times'])
            if total_time < min_value:
                min_value = total_time
                optimized = result
                index = k
    else:  # distance
        min_value = sum(results[0]['all_distances'])
        for k, result in enumerate(results[1:], start=1):
            total_distance = sum(result['all_distances'])
            if total_distance < min_value:
                min_value = total_distance
                optimized = result
                index = k

    logger.info(f"Optimized location {index} selected (based on {optimize_preference})")
    logger.debug(f"Optimized result: {optimized}")

    # Get nearby amenities for the optimal location
    origin_tuple = optimized['origin']
    list_schools = fuzzy_schools(origin_tuple)
    list_hospitals = fuzzy_hospitals(origin_tuple)
    average_sale_price = find_suburb(origin_tuple)

    logger.info(f"Found {len(list_schools)} schools, {len(list_hospitals)} hospitals")
    logger.info(f"Median price: {average_sale_price}")

    # Build and return the response
    return jsonify({
        'midpoint': {
            'lat': optimized['origin'][0],
            'lng': optimized['origin'][1]
        },
        'allDistances': optimized['all_distances'],
        'allTimes': optimized['all_times'],
        'allCoordinates': coordinates,
        'schools': list_schools if isFuzzy else [],
        'hospitals': list_hospitals,
        'median': average_sale_price,
        'averageDistance': optimized['average_distance'],
        'averageTime': optimized['average_time'],
        'weightedTime': optimized['weighted_time']
    })


# =============================================================================
# HELPER FUNCTIONS: NEARBY SEARCH
# =============================================================================
def fuzzy_schools(origin: Tuple[float, float]) -> List[str]:
    """
    Search for nearby schools using Google Places API.
    
    Args:
        origin: Tuple of (latitude, longitude)
        
    Returns:
        List of school names
    """
    try:
        url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            f"?location={origin[0]}%2C{origin[1]}"
            f"&rankby=distance&keyword=high school|primary school&key={key}"
        )

        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if 'results' not in data:
            logger.warning("No school results from Places API")
            return []
        
        schools = [result['name'] for result in data['results']]
        logger.debug(f"Found {len(schools)} schools near {origin}")
        return schools
        
    except requests.RequestException as e:
        logger.error(f"Error fetching schools: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in fuzzy_schools: {e}")
        return []


def fuzzy_hospitals(origin: Tuple[float, float]) -> List[str]:
    """
    Search for nearby hospitals using Google Places API.
    
    Args:
        origin: Tuple of (latitude, longitude)
        
    Returns:
        List of hospital names
    """
    try:
        url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            f"?location={origin[0]}%2C{origin[1]}"
            f"&rankby=distance&type=hospital&keyword=hospital|clinic&key={key}"
        )

        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if 'results' not in data:
            logger.warning("No hospital results from Places API")
            return []
        
        hospitals = [result['name'] for result in data['results']]
        logger.debug(f"Found {len(hospitals)} hospitals near {origin}")
        return hospitals
        
    except requests.RequestException as e:
        logger.error(f"Error fetching hospitals: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error in fuzzy_hospitals: {e}")
        return []


def find_suburb(origin: Tuple[float, float]) -> str:
    """
    Find the suburb and median property price for a location.
    
    Note: Price lookup uses web scraping and is only available for South Africa.
    
    Args:
        origin: Tuple of (latitude, longitude)
        
    Returns:
        String with suburb name and price, or error message
    """
    price1 = -1
    price2 = -1
    suburb = ""
    area_name = ""
    
    # Try to get suburb from nearby places
    try:
        url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            f"?location={origin[0]}%2C{origin[1]}"
            f"&radius=1000&type=restaurant|fuel&key={key}"
        )

        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if data.get('results'):
            area_list = data['results'][0].get('vicinity', '').split(", ")
            logger.debug(f"Area list from places: {area_list}")
            
            if len(area_list) >= 2:
                area_name = area_list[-2]
                try:
                    price2 = int(determine_sale_price(area_name))
                except Exception as e:
                    logger.warning(f"Could not get price for {area_name}: {e}")
                    price2 = -1

    except Exception as e:
        logger.warning(f"Error getting suburb from places: {e}")

    # Try to get suburb from directions API
    try:
        result = gmaps.directions(
            origin=origin,
            destination=(origin[0], origin[1] + 0.001),
            mode="driving",
        )

        if result:
            area_list = result[0]["legs"][0]["start_address"].split(", ")
            logger.debug(f"Area list from directions: {area_list}")
            
            if "South Africa" in area_list:
                suburb = result[0]["legs"][0]["start_address"].split(", ")[1]
                try:
                    price1 = int(determine_sale_price(suburb))
                except Exception as e:
                    logger.warning(f"Could not get price for {suburb}: {e}")
                    price1 = -1
            else:
                return "*Feature only available in South Africa*"
                
    except Exception as e:
        logger.warning(f"Error getting suburb from directions: {e}")

    # Return best result
    if price1 == -1 and price2 == -1:
        return "Price Not Found"

    if price1 > price2:
        logger.info(f"Suburb: {suburb}, Price: R{price1}")
        return f"({suburb}) R{price1}"

    logger.info(f"Suburb: {area_name}, Price: R{price2}")
    return f"({area_name}) R{price2}"


def determine_sale_price(location: str) -> str:
    """
    Scrape property price data from Property24 (South Africa).
    
    Args:
        location: Suburb or area name
        
    Returns:
        Numeric string of average price
    """
    # Skip if Selenium is not available or Chrome is not installed
    if not SELENIUM_AVAILABLE:
        logger.info("Selenium not available - skipping price lookup")
        return "-1"
    
    # Check for Chrome availability before trying to use it
    try:
        import shutil
        chrome_path = shutil.which('chrome') or shutil.which('google-chrome')
        if not chrome_path:
            # Try common Windows paths
            import os
            common_paths = [
                os.path.expandvars(r'%ProgramFiles%\Google\Chrome\Application\chrome.exe'),
                os.path.expandvars(r'%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe'),
                os.path.expandvars(r'%LocalAppData%\Google\Chrome\Application\chrome.exe'),
            ]
            chrome_found = any(os.path.exists(p) for p in common_paths)
            if not chrome_found:
                logger.info("Chrome not found - skipping price lookup")
                return "-1"
    except Exception:
        pass  # Continue and let Selenium handle it
    
    driver = None
    try:
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options
        )
        driver.set_page_load_timeout(30)
        
        # Search for property trends
        driver.get("https://www.google.com/")
        input_elem = driver.find_element(By.CLASS_NAME, "a4bIc")
        input_elem = input_elem.find_element(By.TAG_NAME, "input")
        search_string = f"Property24 trends {location}"
        input_elem.send_keys(search_string)
        input_elem.send_keys(Keys.ENTER)

        # Get first result URL
        website_url = driver.find_element(By.CLASS_NAME, "yuRUbf").get_attribute("innerHTML")
        website_url = website_url[(website_url.index('"') + 1):]
        website_url = website_url[0:(website_url.index('"'))]
        
        # Navigate to Property24 page
        driver.get(website_url)
        content = driver.find_element(
            By.XPATH,
            '//div[@class="p24_results p24_areaTrends"]/div[1]/div[3]/div[1]/div[1]/div[1]/script[1]'
        ).get_attribute("innerHTML")
        
        # Extract price from script content
        content = content[(content.index(";") + 1):]
        content = content[(content.index(";") + 1):]
        important_index = content.index(";")
        content = content[(important_index - 20):important_index - 7]
        numeric_string = "".join(filter(str.isdigit, content))
        
        logger.info(f"Average price in {location}: R{numeric_string}")
        return numeric_string
        
    except Exception as e:
        logger.error(f"Error determining sale price for {location}: {e}")
        raise
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    logger.info("Starting Praelocate API server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
