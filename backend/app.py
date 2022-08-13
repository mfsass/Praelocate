from datetime import datetime
import json
from flask import Flask, jsonify, request
from numpy import place
import googlemaps
from flask_cors import cross_origin, CORS
import logging

app = Flask(__name__)
CORS(app)

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

    loc1_coordinates = (float(loc1["latitude"]), float(loc1["longitude"]))
    loc2_coordinates = (float(loc2["latitude"]), float(loc2["longitude"]))
    loc3_coordinates = (float(loc3["latitude"]), float(loc3["longitude"]))

    try:
        geocode_result_eendrag = gmaps.reverse_geocode((loc1_coordinates))
        geocode_result_neelsie = gmaps.reverse_geocode((loc1_coordinates))
        # print(json.dumps(geocode_result_eendrag, indent=2))
        # print(json.dumps(geocode_result_neelsie, indent=2))

        now = datetime.now()
        directions_result = gmaps.directions(
            origin=loc1_coordinates, destination=loc2_coordinates, departure_time=now
        )
        with open("output.txt", "w") as output:
            output.write(json.dumps(directions_result, indent=2))
        # print(json.dumps(directions_result, indent=2))
        distance = int(directions_result[0]["legs"][0]["distance"]["value"])
        duration = int(directions_result[0]["legs"][0]["duration"]["value"])
        print(f"Distance: {distance}m, Duration: {duration} seconds")
    except:
        return jsonify("Unsucessful request... maybe invalid coordinates")

    return jsonify("Successful request")


@app.route("/")
def home():
    return "Checking home route"
