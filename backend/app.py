from datetime import datetime
import json
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
    for i in range(0, len(list_json)):
        midpoint_lat += coordinates[i][0]
        midpoint_lng += coordinates[i][1]
        # TODO: rank multiplier calculation here

    midpoint_lat = midpoint_lat / len(list_json)  # average of coordinates lat
    midpoint_lng = midpoint_lng / len(list_json)  # average of coordinates lng
    midpoint = {"lat": midpoint_lat, "lng": midpoint_lng}

#$$$
    earth_radius = 3960.0
    degrees_to_radians = math.pi/180.0
    radians_to_degrees = 180.0/math.pi

    radius_in_metres = 1000
    radius_in_kilometres = radius_in_metres/1000
    latitude_degrees = (radius_in_kilometres/earth_radius)*radians_to_degrees
    latitude = midpoint['lat']
    r = earth_radius*math.cos(latitude*degrees_to_radians)
    longitude_degrees = (radius_in_kilometres/r)*radians_to_degrees

    #Creating the four other dictionaries
    average_coordinates_1 = {"lat": midpoint[0], "lng": midpoint[1] + longitude_degrees}
    average_coordinates_2 = {"lat": midpoint[0], "lng": midpoint[1] - longitude_degrees}
    average_coordinates_3 = {"lat": midpoint[0] + latitude_degrees, "lng": midpoint[1]}
    average_coordinates_4 = {"lat": midpoint[0] - latitude_degrees, "lng": midpoint[1]}

    #Storing all of the dictionaries in a list
    average_coordinates_array = [midpoint, average_coordinates_1, average_coordinates_2, 
    average_coordinates_3, average_coordinates_4]
    average_distance_time_array = {}

    #Now, instead of sending the average coordinates you send the tuples at the iteration in the loop
    for j in range(0, 5):
#***
        try:
            average_distance = 0
            average_time = 0
            multiplyer = 0
            multiplyers_added = 0
            average_time_weighted = 0

            now = datetime.now()

            # calculates distance and time
            for i in range(0, len(list_json)):
                origin_tuple = (average_coordinates_array[j]["lat"], average_coordinates_array[j]["lng"])
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
#$$$                
                multiplyer = (all_ranks[i]*-0.2) + 1.5
                multiplyers_added = multiplyers_added + multiplyer
                average_time_weighted = average_time_weighted + multiplyer*duration
#***
                print(
                    f"Distance from midpoint to loc{i+1}: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
                )
#$$$
            average_distance = round(average_distance / (1000 * len(list_json)), 2)
            average_time = round(average_time / (len(list_json) * 60), 2)
            average_time_weighted = round(average_time_weighted/(multiplyers_added * 60), 2)
            location_string = "location_from_mid" + str(j)
            average_distance_time_array.append({location_string: [average_distance, average_time, all_distance, all_time, average_time_weighted]})
            all_distance.clear()
            all_time.clear()
#***
            print(
                f"{location_string}:\nAverage distance: {average_distance}km, Average time: {average_time} minutes"
            )

        except:
            return jsonify("Unsucessful request... maybe invalid coordinates")
#$$$
    min = average_distance_time_array["location_from_mid0"][1]
    for k in range(1, 5):
        key_string = "location_from_mid" + str(k)
        if average_distance_time_array[key_string] < min:
            min = average_distance_time_array[key_string]

    return {
        "avgDistance": min[0],
        "avgTime": min[1],
        "allCoordinates": coordinates,
        "allDistances": min[2],
        "allTimes": min[3],
        "totalTime": sum(min[3])
        } 
#***

# TODO: create test suite
