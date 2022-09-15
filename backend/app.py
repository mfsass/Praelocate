from datetime import datetime
import json
from tkinter import TRUE
import googlemaps
from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS
import math

app = Flask(__name__)
CORS(app)

coordinates = []
all_distance = []
all_time = []
all_coordinates = {}
midpoint = {}
all_ranks = []
location_average_time = []

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
        stra = "location" + str(i)
        loc = request.json[stra]
        item = (float(loc["lat"]), float(loc["lng"]), float(loc["rank"]))
        list_json.append(item)

    # print(list_json)

    return calculate_midpoint(list_json)



def calculate_midpoint(list_json):
    if len(all_distance) > 0:
        all_distance.clear()
    if len(all_time) > 0:
        all_time.clear()

    # ranks
    for i in range(0, len(list_json)):
        all_ranks.append(list_json[i][2])

    # coordinates
    for i in range(0, len(list_json)):
        coordinates.append((list_json[i][0], list_json[i][1]))

    # midpoint average of coordinates
    midpoint_lat = 0.0
    midpoint_lng = 0.0
    weights = 0.0
    for i in range(0, len(list_json)):
        midpoint_lat += coordinates[i][0]*(all_ranks[i]*0.2+0.8)
        midpoint_lng += coordinates[i][1]*(all_ranks[i]*0.2+0.8)
        weights = weights + all_ranks[i]*0.2+0.8
        # TODO: rank multiplier calculation here

    midpoint_lat = midpoint_lat / weights # average of coordinates lat
    midpoint_lng = midpoint_lng / weights  # average of coordinates lng
    midpoint = {"lat": midpoint_lat, "lng": midpoint_lng}


    earth_radius = 6378.0
    degrees_to_radians = math.pi/180.0
    radians_to_degrees = 180.0/math.pi

    radius_in_metres = 1000
    radius_in_kilometres = radius_in_metres/1000
    latitude_degrees = (radius_in_kilometres/earth_radius)*radians_to_degrees
    latitude = midpoint['lat']
    r = earth_radius*math.cos(latitude*degrees_to_radians)
    longitude_degrees = (radius_in_kilometres/r)*radians_to_degrees

    #Creating the four other dictionaries
    average_coordinates_1 = {"lat": midpoint_lat, "lng": midpoint_lng + longitude_degrees}
    average_coordinates_2 = {"lat": midpoint_lat, "lng": midpoint_lng - longitude_degrees}
    average_coordinates_3 = {"lat": midpoint_lat + latitude_degrees, "lng": midpoint_lng}
    average_coordinates_4 = {"lat": midpoint_lat - latitude_degrees, "lng": midpoint_lng}

    #Storing all of the dictionaries in a list
    average_coordinates_array = [midpoint, average_coordinates_1, average_coordinates_2, 
    average_coordinates_3, average_coordinates_4]
    average_distance_time_array = []

    #Now, instead of sending the average coordinates you send the tuples at the iteration in the loop
    for j in range(0, 5):

        # try:
        average_distance = 0
        average_time = 0
        multiplyer = 0
        multiplyers_added = 0
        average_time_weighted = 0

        now = datetime.now()
        origin_tuple = (average_coordinates_array[j]["lat"], average_coordinates_array[j]["lng"])

        # calculates distance and time
        for i in range(0, len(list_json)):
            
            directions_result = gmaps.directions(
                origin=origin_tuple,
                destination=(coordinates[i][0], coordinates[i][1]),
                departure_time=now,
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(directions_result[0]["legs"][0]["duration"]["value"])

            all_distance.append(round((distance / 1000), 2))
            all_time.append(round((duration / 60), 2))
            average_distance += distance
            average_time += duration
            
            multiplyer = (all_ranks[i]*-0.2) + 1.5
            multiplyers_added = multiplyers_added + multiplyer
            average_time_weighted = average_time_weighted + multiplyer*duration

            print(
                f"Distance from midpoint to loc{i+1}: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
            )

        average_distance = round(average_distance / (1000 * len(list_json)), 2)
        average_time = round(average_time / (len(list_json) * 60), 2)
        average_time_weighted = round(average_time_weighted/(multiplyers_added * 60), 2)
        location_string = "location_from_mid" + str(j)
        average_distance_time_array.append([average_distance, average_time, all_distance, all_time, average_time_weighted, origin_tuple])
        all_distance.clear()
        all_time.clear()

        print(
            f"{location_string}:\nAverage distance: {average_distance}km, Average time: {average_time} minutes"
        )

        # except:
        #     return jsonify("Unsucessful request... maybe invalid coordinates")

    #TODO optimise through distance/time ifs
    optimisation = "t"
    min = 0.0
    optimised_location = average_distance_time_array[0]
    if optimisation == "t":
        min = average_distance_time_array[0][1]
        for k in range(1, 5):
        # key_string = "location_from_mid" + str(k)
            if average_distance_time_array[k][1] < min:
                min = average_distance_time_array[k][1]
                optimised_location = average_distance_time_array[k]
    elif optimisation == "d":
        min = average_distance_time_array[0][0]
        for k in range(1, 5):
            if average_distance_time_array[k][0] < min:
                min = average_distance_time_array[k][0]
                optimised_location = average_distance_time_array[k]

    return {
        "avgDistance": optimised_location[0],
        "avgTime": optimised_location[1],
        "allCoordinates": coordinates,
        "allDistances": optimised_location[2],
        "allTimes": optimised_location[3],
        "totalTime": sum(optimised_location[3]),
        "midpoint": optimised_location[5]
        } 


# TODO: create test suite
