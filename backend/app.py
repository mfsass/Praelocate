from datetime import datetime, timedelta
import json
import googlemaps
import requests
from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS
import math
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options

app = Flask(__name__)
CORS(app)
# app.run(debug=True)


# top secret
with open("api-key.txt") as api_file:
    key = api_file.readline()

try:
    gmaps = googlemaps.Client(key=key)
except:
    print("Invalid api key")
    exit(0)


@app.route("/newMidpoint", methods=["POST"])
@cross_origin()
def new_midpoint():
    # recalculates distances and times from midpoint to coordinates
    # returns new midpoint and new distances and times
    data = request.get_json()
    # print(data)
    origin_tuple = (
        data["midpoint"]["lat"],
        data["midpoint"]["lng"],
    )
    # print(coordinates)

    # calculate distances and times from midpoint to coordinates
    list_distances = []
    list_times = []

    for i in range(0, len(coordinates)):
        # print(f"Calculating distance from {midpoint} to {coordinates[i]}")
        time_str = times[i]
        time_object = datetime.strptime(time_str, "%H:%M").time()
        time_object = datetime.combine(
            datetime.today() + timedelta(days=1), time_object
        )

        result = gmaps.directions(
            origin=origin_tuple,
            destination=(coordinates[i][0], coordinates[i][1]),
            mode="driving",
            departure_time=time_object,
        )

        # only keep the suburb split after 2nd of comma
        # print(result[0]["legs"][0]["start_address"])
        suburb = result[0]["legs"][0]["start_address"].split(",")[1]
        # print(f"Suburb: {suburb}")

        distance = int(result[0]["legs"][0]["distance"]["value"])
        duration = int(
            result[0]["legs"][0]["duration_in_traffic"]["value"]
            # directions_result[0]["legs"][0]["duration"]["value"]
        )

        list_distances.append(round((distance / 1000), 2))
        list_times.append(round((duration / 60), 2))

    print(f"Distances: {list_distances}")
    print(f"Times: {list_times}")

    # calculate best schools
    list_schools = fuzzy_schools(origin_tuple)
    list_hospitals = fuzzy_hospitals(origin_tuple)
    average_price = find_suburb(origin_tuple)
    print(f"Price: {average_price}")

    return {
        "allCoordinates": coordinates,
        "allDistances": list_distances,
        "allTimes": list_times,
        "schools": list_schools,
        "hospitals": list_hospitals,
        "median": average_price,
    }


@app.route("/locations", methods=["POST"])
@cross_origin()
def locations():
    # reset all variables
    global coordinates
    global all_coordinates
    global midpoint
    global all_ranks
    global times
    global radius, optimize_preference
    global isFuzzy

    coordinates = []
    all_coordinates = {}
    midpoint = {}
    all_ranks = []
    times = []

    # print(request.json)

    radius = request.json["radius"]
    optimize_preference = request.json["preference"]
    isFuzzy = request.json["isFuzzy"] == "true"

    # no_locations = len(request.json)
    # NOTE: if optimize_preference is given subtract 1 from no_locations
    # no_locations = no_locations - 1 if "optimize" in request.json else no_locations

    list_json = []
    locations = request.json["locations"]
    for location in locations:
        item = (
            float(location["coordinates"]["lat"]),
            float(location["coordinates"]["lng"]),
            float(location["rank"]),
            str(location["time"]),
        )
        list_json.append(item)

    print(list_json)

    return calculate_midpoint(list_json)


def calculate_midpoint(list_json):

    for i in range(0, len(list_json)):
        all_ranks.append(list_json[i][2])  # ranks
        coordinates.append((list_json[i][0], list_json[i][1]))  # coordinates
        times.append((list_json[i][3]))  # time

    # NOTE: rank multiplier calculation here
    midpoint_lat = 0.0
    midpoint_lng = 0.0
    weights = 0.0

    # calculates weighted center mean
    for i in range(0, len(list_json)):
        midpoint_lat += coordinates[i][0] * (all_ranks[i])
        # NOTE: weight multiplier to be discussed how much it should affect
        midpoint_lng += coordinates[i][1] * (all_ranks[i])
        weights = weights + all_ranks[i]

    midpoint_lat = midpoint_lat / weights  # average of coordinates lat
    midpoint_lng = midpoint_lng / weights  # average of coordinates lng
    midpoint = {"lat": midpoint_lat, "lng": midpoint_lng}
    print(f"Weighted midpoint: {midpoint}\n")

    earth_radius = 6378.0
    degrees_to_radians = math.pi / 180.0
    radians_to_degrees = 180.0 / math.pi

    radius_in_kilometers = radius
    latitude_degrees = (radius_in_kilometers / earth_radius) * radians_to_degrees
    latitude = midpoint["lat"]
    r = earth_radius * math.cos(latitude * degrees_to_radians)
    longitude_degrees = (radius_in_kilometers / r) * radians_to_degrees

    # Creating the four other dictionaries
    average_coordinates_1 = {
        "lat": midpoint_lat,
        "lng": midpoint_lng + longitude_degrees,
    }
    average_coordinates_2 = {
        "lat": midpoint_lat,
        "lng": midpoint_lng - longitude_degrees,
    }
    average_coordinates_3 = {
        "lat": midpoint_lat + latitude_degrees,
        "lng": midpoint_lng,
    }
    average_coordinates_4 = {
        "lat": midpoint_lat - latitude_degrees,
        "lng": midpoint_lng,
    }

    # Storing all of the dictionaries in a list
    average_coordinates_array = [
        midpoint,
        average_coordinates_1,
        average_coordinates_2,
        average_coordinates_3,
        average_coordinates_4,
    ]
    average_distance_time_array = []

    # Now, instead of sending the average coordinates you send the tuples at the iteration in the loop
    for j in range(0, 5):
        all_distance = []
        all_time = []
        try:
            average_distance = 0
            average_time = 0
            multiplier = 0
            multipliers_added = 0
            average_time_weighted = 0

            # now = datetime.now()
            origin_tuple = (
                average_coordinates_array[j]["lat"],
                average_coordinates_array[j]["lng"],
            )

            location_string = "location_from_mid" + str(j)

            # print(f"{location_string}:")

            # calculates distance and time
            for i in range(len(list_json)):
                # time specified for tomorrow's (can be changed to future date) traffic report
                time_str = times[i]
                time_object = datetime.strptime(time_str, "%H:%M").time()
                time_object = datetime.combine(
                    datetime.today() + timedelta(days=1), time_object
                )
                # print(time_object)
                # print((coordinates[i][0], coordinates[i][1]))
                directions_result = gmaps.directions(
                    origin=origin_tuple,
                    destination=(coordinates[i][0], coordinates[i][1]),
                    mode="driving",
                    departure_time=time_object,
                    # arrival_time=time_object,
                )
                if len(directions_result) == 0:
                    print("Too many requests... chill a minute or two")
                    return jsonify("Too many requests from backend")

                distance = int(directions_result[0]["legs"][0]["distance"]["value"])
                duration = int(
                    directions_result[0]["legs"][0]["duration_in_traffic"]["value"]
                    # directions_result[0]["legs"][0]["duration"]["value"]
                )
                # print(directions_result[0]["legs"][0]["end_address"])
                # suburb = directions_result[0]["legs"][0]["end_address"].split(",")[1]
                # print(suburb)

                all_distance.append(round((distance / 1000), 2))
                all_time.append(round((duration / 60), 2))
                average_distance += distance
                average_time += duration

                # print(
                #     f"Distance from midpoint to loc{i+1}: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
                # )

                multiplier = (all_ranks[i] * -0.2) + 1.5
                multipliers_added = multipliers_added + multiplier
                average_time_weighted = average_time_weighted + multiplier * duration

            average_distance = round(average_distance / (1000 * len(list_json)), 2)
            average_time = round(average_time / (len(list_json) * 60), 2)
            average_time_weighted = round(
                average_time_weighted / (multipliers_added * 60), 2
            )

            average_distance_time_array.append(
                [
                    average_distance,  # 0
                    average_time,  # 1
                    all_distance,  # 2
                    all_time,  # 3
                    average_time_weighted,  # 4
                    origin_tuple,  # 5
                ]
            )

            # print(
            #     f"Average distance: {average_distance}km, Average time: {average_time} minutes"
            # )

            # print(f"Midpoint: {origin_tuple}")
            # print(f"Total distance: {round(sum(all_distance),2)} kms")
            # print(f"Total time: {round(sum(all_time),2)} minutes \n")

        except:
            return jsonify("Unsuccessful request...")

    # NOTE: optimize through distance/time ifs
    min = 0.0
    global index
    index = 0
    optimized_location = average_distance_time_array[0]
    if optimize_preference == "time":
        min = sum(average_distance_time_array[0][3])
        for k in range(1, 5):
            # key_string = "location_from_mid" + str(k)
            if sum(average_distance_time_array[k][3]) < min:
                min = sum(average_distance_time_array[k][3])
                optimized_location = average_distance_time_array[k]
                index = k
    elif optimize_preference == "distance":
        min = sum(average_distance_time_array[0][2])
        for k in range(1, 5):
            if sum(average_distance_time_array[k][2]) < min:
                min = sum(average_distance_time_array[k][2])
                optimized_location = average_distance_time_array[k]
                index = k

    print("-------------------")
    print(
        f"Optimized location{index} [based on {optimize_preference}] \nDetails: Avg distance, Avg time, All distances, All times, Avg time weighted, Origin"
    )
    print(optimized_location)
    origin_tuple = (
        optimized_location[5][0],
        optimized_location[5][1],
    )
    list_schools = fuzzy_schools(origin_tuple)
    list_hospitals = fuzzy_hospitals(origin_tuple)

    # Median Price
    average_sale_price = find_suburb(origin_tuple)

    print("\n------Schools------")
    # print list(school)
    for i in range(len(list_schools)):
        print(list_schools[i])
    print("-------------------\n")

    print("\n------Hospitals------")
    # print list(school)
    for i in range(len(list_hospitals)):
        print(list_hospitals[i])
    print("-------------------\n")

    return {
        "avgDistance": optimized_location[0],
        "avgTime": optimized_location[1],
        "allCoordinates": coordinates,
        "allDistances": optimized_location[2],
        "allTimes": optimized_location[3],
        "totalTime": sum(optimized_location[3]),
        "totalDistance": sum(optimized_location[2]),
        "midpoint": {"lat": optimized_location[5][0], "lng": optimized_location[5][1]},
        "schools": list_schools,
        "median": average_sale_price,
        "hospitals": list_hospitals,
    }


def fuzzy_schools(origin):
    # print(radius)
    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
        + str(origin[0])
        + "%2C"
        + str(origin[1])
        + "&rankby=distance&keyword=high school|primary school&key="
        + key
        # rank by prominence
    )

    payload = {}
    headers = {}

    response = requests.request("GET", url, headers=headers, data=payload)
    # calculate length of Response
    length = len(response.json()["results"])

    # return name of schools in list_schools
    list_schools = []

    for i in range(0, length):
        list_schools.append(response.json()["results"][i]["name"])

    return list_schools


def find_suburb(origin):
    price1 = 0
    price2 = 0
    try:
        url = (
            "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
            + str(origin[0])
            + "%2C"
            + str(origin[1])
            + "&radius=1000&type=restaurant|fuel&key="
            + key
        )

        payload = {}
        headers = {}

        response = requests.request("GET", url, headers=headers, data=payload)
        # print area
        area_list = response.json()["results"][0]["vicinity"].split(", ")
        # check if south africa is contained in area
        print(area_list)
        price2 = -1

        response = area_list[len(area_list) - 2]
        print(response)
        price2 = int(determine_sale_price(response))

    except:
        price2 = -1

    try:
        result = gmaps.directions(
            origin=origin,
            destination=(origin[0], origin[1] + 0.001),
            mode="driving",
        )

        area_list = result[0]["legs"][0]["start_address"].split(", ")
        print(area_list)
        if area_list.count("South Africa") > 0:
            suburb = result[0]["legs"][0]["start_address"].split(", ")[1]
            price1 = int(determine_sale_price(suburb))
        else:
            return " *Feature only available in South Africa* "
    except:
        price1 = -1

    if (price1 == -1) and (price2 == -1):
        return " Price Not Found"

    if price1 > price2:
        print(f"Suburb: {suburb}")
        return " (" + suburb + ") R" + str(price1)

    print(f"Suburb: {response}")
    return " (" + response + ") R" + str(price2)


def fuzzy_hospitals(origin):
    # print(radius)
    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="
        + str(origin[0])
        + "%2C"
        + str(origin[1])
        + "&rankby=distance&type=hospital&keyword=hospital|clinic&key="
        + key
        # rank by prominence
    )

    payload = {}
    headers = {}

    response = requests.request("GET", url, headers=headers, data=payload)
    # calculate length of Response
    length = len(response.json()["results"])

    # return name of schools in list_schools
    list_hospitals = []

    for i in range(0, length):
        list_hospitals.append(response.json()["results"][i]["name"])

    return list_hospitals


def determine_sale_price(location):
    options = Options()
    options.headless = True

    driver = webdriver.Chrome(ChromeDriverManager().install(), options=options)
    driver.get("https://www.google.com/")
    inputElem = driver.find_element(By.CLASS_NAME, "a4bIc")
    inputElem = inputElem.find_element(By.TAG_NAME, "input")
    search_string = "Property24 trends" + location
    inputElem.send_keys(search_string)
    inputElem.send_keys(Keys.ENTER)
    # print(driver.current_url)

    websiteURL = driver.find_element(By.CLASS_NAME, "yuRUbf").get_attribute("innerHTML")
    websiteURL = websiteURL[(websiteURL.index('"') + 1) :]
    websiteURL = websiteURL[0 : (websiteURL.index('"'))]
    # print(websiteURL)
    # driver.close()

    # driver = webdriver.Chrome(ChromeDriverManager().install())
    driver.get(websiteURL)
    content = driver.find_element(
        By.XPATH,
        '//div[@class="p24_results p24_areaTrends"]/div[1]/div[3]/div[1]/div[1]/div[1]/script[1]',
    ).get_attribute("innerHTML")
    content = content[(content.index(";") + 1) :]
    content = content[(content.index(";") + 1) :]
    importantIndex = content.index(";")
    content = content[(importantIndex - 20) : importantIndex - 7]
    numeric_filter = filter(str.isdigit, content)
    numeric_string = "".join(numeric_filter)
    print("\nThe average price in " + location + " is R" + numeric_string)
    return numeric_string
