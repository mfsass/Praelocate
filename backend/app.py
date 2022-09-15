from datetime import datetime, timedelta
import json
from tkinter import TRUE
import googlemaps
from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS
import math

app = Flask(__name__)
CORS(app)

coordinates = []

all_coordinates = {}
midpoint = {}
all_ranks = []
location_average_time = []
times = []


# top secret
with open("api-key.txt") as api_file:
    key = api_file.readline()

try:
    gmaps = googlemaps.Client(key=key)
except:
    print("Invalid api key")
    exit(0)


@app.route("/locations", methods=["POST"])
@cross_origin()
def locations():
    # print(request)
    # print(request.json)
    no_locations = len(request.json)

    list_json = []
    for i in range(1, no_locations):
        loc_str = "location" + str(i)
        loc = request.json[loc_str]
        item = (
            float(loc["lat"]),
            float(loc["lng"]),
            float(loc["rank"]),
            str(loc["time"]),
        )
        list_json.append(item)

    # print(list_json)

    return calculate_midpoint(list_json)


def calculate_midpoint(list_json):
    # if len(all_distance) > 0:
    #     all_distance.clear()
    # if len(all_time) > 0:
    #     all_time.clear()

    for i in range(0, len(list_json)):
        all_ranks.append(list_json[i][2])  # ranks
        coordinates.append((list_json[i][0], list_json[i][1]))  # coordinates
        times.append((list_json[i][3]))  # time

    # print(times)

    # midpoint average of coordinates
    # midpoint_lat = 0.0
    # midpoint_lng = 0.0
    # for i in range(0, len(list_json)):
    #     midpoint_lat += coordinates[i][0]
    #     midpoint_lng += coordinates[i][1]

    # midpoint_lat = midpoint_lat / len(list_json)  # average of coordinates lat
    # midpoint_lng = midpoint_lng / len(list_json)  # average of coordinates lng
    # midpoint = {"lat": midpoint_lat, "lng": midpoint_lng}
    # print(midpoint)

    # NOTE: rank multiplier calculation here
    midpoint_lat = 0.0
    midpoint_lng = 0.0
    weights = 0.0

    # calculates weighted center mean
    for i in range(0, len(list_json)):
        midpoint_lat += coordinates[i][0] * (
            all_ranks[i] * 0.2 + 0.8
        )  # NOTE: 0.2 and 0.8?
        midpoint_lng += coordinates[i][1] * (all_ranks[i] * 0.2 + 0.8)
        weights = weights + all_ranks[i] * 0.2 + 0.8

    midpoint_lat = midpoint_lat / weights  # average of coordinates lat
    midpoint_lng = midpoint_lng / weights  # average of coordinates lng
    midpoint = {"lat": midpoint_lat, "lng": midpoint_lng}
    print(midpoint)

    earth_radius = 6378.0
    degrees_to_radians = math.pi / 180.0
    radians_to_degrees = 180.0 / math.pi

    radius_in_metres = 1000
    radius_in_kilometers = radius_in_metres / 1000
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
        # try:
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
        print(f"{location_string}:")

        # calculates distance and time
        for i in range(0, len(list_json)):
            # time specified for tomorrow's (can be changed to future date) traffic report
            time_str = times[i]
            time_object = datetime.strptime(time_str, "%H:%M").time()
            time_object = datetime.combine(
                datetime.today() + timedelta(days=1), time_object
            )
            # print(time_object)
            directions_result = gmaps.directions(
                origin=origin_tuple,
                destination=(coordinates[i][0], coordinates[i][1]),
                mode="driving",
                departure_time=time_object,
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(
                directions_result[0]["legs"][0]["duration_in_traffic"]["value"]
            )

            all_distance.append(round((distance / 1000), 2))
            all_time.append(round((duration / 60), 2))
            average_distance += distance
            average_time += duration

            print(
                f"Distance from midpoint to loc{i+1}: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
            )

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

        print(
            f"Average distance: {average_distance}km, Average time: {average_time} minutes"
        )

        print(f"Midpoint: {origin_tuple}")
        print(f"Total distance: {round(sum(all_distance),2)} kms")
        print(f"Total time: {round(sum(all_time),2)} minutes \n")

        # except:
        #     return jsonify("Unsucessful request... maybe invalid coordinates")

    # NOTE: optimize through distance/time ifs
    optimization = "t"
    min = 0.0
    optimized_location = average_distance_time_array[0]
    if optimization == "t":
        min = sum(average_distance_time_array[0][3])
        for k in range(1, 5):
            # key_string = "location_from_mid" + str(k)
            if sum(average_distance_time_array[k][3]) < min:
                min = sum(average_distance_time_array[k][3])
                optimized_location = average_distance_time_array[k]
    elif optimization == "d":
        min = sum(average_distance_time_array[0][2])
        for k in range(1, 5):
            if sum(average_distance_time_array[k][2]) < min:
                min = sum(average_distance_time_array[k][2])
                optimized_location = average_distance_time_array[k]

    print(optimized_location)

    return {
        "avgDistance": optimized_location[0],
        "avgTime": optimized_location[1],
        "allCoordinates": coordinates,
        "allDistances": optimized_location[2],
        "allTimes": optimized_location[3],
        "totalTime": sum(optimized_location[3]),
        "midpoint": optimized_location[5],
    }
