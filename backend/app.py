from ast import For
from datetime import datetime
import json
from flask import Flask, jsonify, request
from numpy import place
import googlemaps
from flask_cors import cross_origin, CORS
import numpy as np

app = Flask(__name__)
CORS(app)

allDistance = []
allTime = []
allCoordinates = []
midpoint = ''
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
    loc1 = request.json["location1"]
    loc2 = request.json["location2"]
    loc3 = request.json["location3"]
    print(f"Location1: {loc1}")
    print(f"Location2: {loc2}")
    print(f"Location3: {loc3}")
    allDistance.clear()
    allTime.clear()
    allCoordinates.clear()

    loc1_coordinates = (float(loc1["latitude"]), float(loc1["longitude"]))
    loc2_coordinates = (float(loc2["latitude"]), float(loc2["longitude"]))
    loc3_coordinates = (float(loc3["latitude"]), float(loc3["longitude"]))

    average_coordinates_latitude = (float(
        loc1_coordinates[0])+float(loc2_coordinates[0])+float(loc3_coordinates[0]))/3
    average_coordinates_longitude = (float(
        loc1_coordinates[1])+float(loc2_coordinates[1])+float(loc3_coordinates[1]))/3

    midpoint = str(average_coordinates_latitude) + ", " + \
        str(average_coordinates_longitude)
    print("Midpoint of coordinates = " + midpoint)
    average_coordinates = (average_coordinates_latitude,
                           average_coordinates_longitude)
    # print(average_coordinates)

    try:
        geocode_result_eendrag = gmaps.reverse_geocode((loc1_coordinates))
        geocode_result_neelsie = gmaps.reverse_geocode((loc1_coordinates))
        # print(json.dumps(geocode_result_eendrag, indent=2))
        # print(json.dumps(geocode_result_neelsie, indent=2))
        average_distance = 0
        average_time = 0

        now = datetime.now()
        directions_result = gmaps.directions(
            origin=average_coordinates, destination=loc1_coordinates, departure_time=now
        )
        with open("output.txt", "w") as output:
            output.write(json.dumps(directions_result, indent=2))
        # print(json.dumps(directions_result, indent=2))
        distance = int(directions_result[0]["legs"][0]["distance"]["value"])
        duration = int(directions_result[0]["legs"][0]["duration"]["value"])
        allDistance.append(round((distance/1000), 2))
        allTime.append(round((duration/60), 2))
        average_distance += distance
        average_time += duration
        print(
            f"Distance from midpoint to loc1: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes")

        directions_result = gmaps.directions(
            origin=average_coordinates, destination=loc2_coordinates, departure_time=now
        )
        with open("output.txt", "w") as output:
            output.write(json.dumps(directions_result, indent=2))
        # print(json.dumps(directions_result, indent=2))
        distance = int(directions_result[0]["legs"][0]["distance"]["value"])
        duration = int(directions_result[0]["legs"][0]["duration"]["value"])
        allDistance.append(round((distance/1000), 2))
        allTime.append(round((duration/60), 2))
        average_distance += distance
        average_time += duration
        print(
            f"Distance from midpoint to loc2: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes")

        directions_result = gmaps.directions(
            origin=average_coordinates, destination=loc3_coordinates, departure_time=now
        )
        with open("output.txt", "w") as output:
            output.write(json.dumps(directions_result, indent=2))
        # print(json.dumps(directions_result, indent=2))
        distance = int(directions_result[0]["legs"][0]["distance"]["value"])
        duration = int(directions_result[0]["legs"][0]["duration"]["value"])
        allDistance.append(round((distance/1000), 2))
        allTime.append(round((duration/60), 2))
        average_distance += distance
        average_time += duration
        print(
            f"Distance from midpoint to loc3: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes")

        average_distance = round((average_distance/1000)/3, 2)
        average_time = round((average_time/60)/3, 2)
        allCoordinates.append(
            ((loc1["latitude"])+" " + (loc1["longitude"])))
        allCoordinates.append(
            ((loc2["latitude"])+" " + (loc2["longitude"])))
        allCoordinates.append(
            ((loc3["latitude"])+" " + (loc3["longitude"])))

    except:
        return jsonify("Unsucessful request... maybe invalid coordinates")

    # return jsonify(str(average_coordinates_latitude) +
        #    ","+str(average_coordinates_longitude))

    return {
        'coordinates': average_coordinates,
        'distance': average_distance,
        'time': average_time,
        'allCoordinates': allCoordinates,
        'allDistances': allDistance,
        'allTimes': allTime
    }


@app.route("/getLocations", methods=["GET"])
@cross_origin()
def getLocations():
    return jsonify(allCoordinates)
