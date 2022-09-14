from datetime import datetime
import json
import googlemaps
from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS

app = Flask(__name__)
CORS(app)

coordinates = []
all_distance = []
all_time = []
all_coordinates = {}
midpoint = {}
all_ranks = []

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
        stra = f"loc{str(i)}"
        loc = request.json[stra]
        item = (float(loc["lat"]), float(loc["lng"]), float(loc["rank"]), loc["time"])
        
        list_json.append(item)

    print(list_json)

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

    try:
        average_distance = 0
        average_time = 0

        now = datetime.now()

        # calculates distance and time
        for i in range(0, len(list_json)):

            directions_result = gmaps.directions(
                origin=(midpoint["lat"], midpoint["lng"]),
                destination=(coordinates[i][0], coordinates[i][1]),
                departure_time=now,
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(directions_result[0]["legs"][0]["duration"]["value"])

            all_distance.append(round((distance / 1000), 2))
            all_time.append(round((duration / 60), 2))
            average_distance += distance
            average_time += duration

            print(
                f"Distance from midpoint to loc{i+1}: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes"
            )

        average_distance = round(average_distance / (1000 * len(list_json)), 2)
        average_time = round(average_time / (len(list_json) * 60), 2)

        print(
            f"Average distance: {average_distance}km, Average time: {average_time} minutes"
        )

        print(f"Midpoint: {midpoint['lat']}, {midpoint['lng']}")
        print(f"Total time: {sum(all_time)} minutes")

    except:
        return jsonify("Unsucessful request... maybe invalid coordinates")

    return {
        "avgDistance": average_distance,
        "avgTime": average_time,
        "allCoordinates": coordinates,
        "allDistances": all_distance,
        "allTimes": all_time,
        "totalTime": sum(all_time),
        "midpoint": midpoint,
    }


# TODO: create test suite
