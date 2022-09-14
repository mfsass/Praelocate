from ast import For
from datetime import datetime
import json
from xml.etree.ElementTree import PI
from flask import Flask, jsonify, request
from numpy import place
import googlemaps
from flask_cors import cross_origin, CORS
import numpy as np
import math

app = Flask(__name__)
CORS(app)

allDistance = []
allTime = []
allCoordinates = []
midpoint = ""
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

    loc1_coordinates = (float(loc1["lat"]), float(loc1["lng"]))
    loc2_coordinates = (float(loc2["lat"]), float(loc2["lng"]))
    loc3_coordinates = (float(loc3["lat"]), float(loc3["lng"]))

    average_coordinates_latitude = (
        float(loc1_coordinates[0])
        + float(loc2_coordinates[0])
        + float(loc3_coordinates[0])
    ) / 3
    average_coordinates_longitude = (
        float(loc1_coordinates[1])
        + float(loc2_coordinates[1])
        + float(loc3_coordinates[1])
    ) / 3

    midpoint = {
        "lat": round(average_coordinates_latitude, ndigits=7),
        "lng": round(average_coordinates_longitude, ndigits=7),
    }
    print(f"Midpoint of coordinates: {midpoint['lat']}, {midpoint['lng']}")
    average_coordinates = (average_coordinates_latitude, average_coordinates_longitude)
    # print(average_coordinates)

    allCoordinates.append((f'{loc1["lat"]} {loc1["lng"]}'))
    allCoordinates.append((f'{loc2["lat"]} {loc2["lng"]}'))
    allCoordinates.append((f'{loc3["lat"]} {loc3["lng"]}'))
    allCoordinates.append((f'{midpoint["lat"]} {midpoint["lng"]}'))


    #Getting degrees to add on
    earth_radius = 3960.0
    degrees_to_radians = math.pi/180.0
    radians_to_degrees = 180.0/math.pi
    radius_in_metres = 1000
    radius_in_kilometres = radius_in_metres/1000
    latitude_degrees = (radius_in_kilometres/earth_radius)*radians_to_degrees
    latitude = midpoint['lat']
    r = earth_radius*math.cos(latitude*degrees_to_radians)
    longitude_degrees = (radius_in_kilometres/r)*radians_to_degrees
    
    #Creating the four other tuples
    average_coordinates_1 = (average_coordinates[0], average_coordinates[1] + longitude_degrees)
    average_coordinates_2 = (average_coordinates[0], average_coordinates[1] - longitude_degrees)
    average_coordinates_3 = (average_coordinates[0] + latitude_degrees, average_coordinates[1])
    average_coordinates_4 = (average_coordinates[0] - latitude_degrees, average_coordinates[1])

    #Storing all of the tuples in a tuple array and array to store the average distance and time for each altered midpoint
    average_coordinates_array = [average_coordinates, average_coordinates_1, average_coordinates_2, average_coordinates_3, average_coordinates_4]
    average_distance_time_array = []

    #Now, instead of sending the average coordinates you send the tuples at the iteration in the loop
    for x in range(0, 5):
        
        try:
            average_distance = 0
            average_time = 0
            print(f"{x}")

            now = datetime.now()
            directions_result = gmaps.directions(
                origin=average_coordinates_array[x], destination=loc1_coordinates, departure_time=now
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(directions_result[0]["legs"][0]["duration"]["value"])
            average_distance += distance
            average_time += duration
            print(
                f"Distance from midpoint to loc1: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
            )

            directions_result = gmaps.directions(
                origin=average_coordinates_array[x], destination=loc2_coordinates, departure_time=now
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(directions_result[0]["legs"][0]["duration"]["value"])
            average_distance += distance
            average_time += duration
            print(
                f"Distance from midpoint to loc2: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
            )

            directions_result = gmaps.directions(
                origin=average_coordinates_array[x], destination=loc3_coordinates, departure_time=now
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(directions_result[0]["legs"][0]["duration"]["value"])
            average_distance += distance
            average_time += duration
            print(
                f"Distance from midpoint to loc3: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
            )
            print("Hello there")
            average_distance = round((average_distance / 1000) / 3, 2)
            average_time = round((average_time / 60) / 3, 2)
            average_distance_time_array.append([average_distance, average_time])

        except:
            return jsonify("Unsucessful request... maybe invalid coordinates")
        
    # return jsonify(str(average_coordinates_latitude) +
    #    ","+str(average_coordinates_longitude))

    return jsonify("Success")


# return {
#     'coordinates': average_coordinates,
#     'distance': average_distance,
#     'time': average_time,
#     'allCoordinates': allCoordinates,
#     'allDistances': allDistance,
#     'allTimes': allTime
# }


@app.route("/getLocations", methods=["GET"])
@cross_origin()
def getLocations():
    return jsonify(allCoordinates)
