from datetime import datetime
import json
from textwrap import indent
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
    try:
        loc1 = request.json["location1"]
        loc2 = request.json["location2"]
        loc3 = request.json["location3"]
    except:
        print("Yeah didn't work")
        return jsonify("Error")
        
    print(f"Location1: {loc1}")
    print(f"Location2: {loc2}")
    print(f"Location3: {loc3}")
    
    return calculate_midpoint(loc1, loc2, loc3)

def calculate_midpoint(loc1, loc2, loc3):
    if (len(all_distance) > 0): all_distance.clear()
    if (len(all_time) > 0): all_time.clear()
    
    try:
        coordinates = [
            (float(loc1["lat"]), float(loc1["lng"])),
            (float(loc2["lat"]), float(loc2["lng"])),
            (float(loc3["lat"]), float(loc3["lng"])),
        ]
    except:
        print("Yeah didn't work")
        return jsonify("Error with format")
    
    midpoint = {
        "lat": round((float(coordinates[0][0])
                + float(coordinates[1][0])
                + float(coordinates[2][0])
                ) / 3, ndigits=7),
        "lng": round((float(coordinates[0][1])
                + float(coordinates[1][1])
                + float(coordinates[2][1])
                ) / 3, ndigits=7)
    }
    
    print(f"Midpoint: {midpoint['lat']}, {midpoint['lng']}")

    try:
        average_distance = 0
        average_time = 0
  
        now = datetime.now()
        
     
        for i in range(3):
                
            directions_result = gmaps.directions(
                origin=(midpoint["lat"], midpoint["lng"]), destination=coordinates[i], departure_time=now
            )
            distance = int(directions_result[0]["legs"][0]["distance"]["value"])
            duration = int(directions_result[0]["legs"][0]["duration"]["value"])

            all_distance.append(round((distance / 1000), 2))
            all_time.append(round((duration / 60), 2))
            average_distance += distance
            average_time += duration
        
            print(f"Distance from midpoint to loc{i}: {round((distance/1000),2)}km, Duration: {round((duration/60),2)} minutes")
            

        average_distance = round(average_distance / (1000 * 3), 2)
        average_time = round(average_time / (3 * 60), 2)

        all_coordinates = {
            "location1": { "lat": loc1["lat"], "lng": loc1["lng"] },
            "location2": { "lat": loc2["lat"], "lng": loc2["lng"] },
            "location3": { "lat": loc3["lat"], "lng": loc3["lng"] },
            "midpoint": { "lat": midpoint["lat"], "lng": midpoint["lng"] }
        }
        print(json.dumps(all_coordinates, indent=2))

    except:
        return jsonify("Unsucessful request... maybe invalid coordinates")

    return {
        "distance": average_distance,
        "time": average_time,
        "allCoordinates": all_coordinates,
        "allDistances": all_distance,
        "allTimes": all_time
    }
   
    
if __name__ == "__main__":
    # location1 => -33.93253245739606. 18.86538266947165 -> Neelsie
    # location2 => -33.93394265945938, 18.866166840635923 -> Endler
    # location3 => -33.964739490852224, 18.831907167622273 -> Gino's

    loc1 = {
        "lat": -33.93253245739606,
        "lng":  18.86538266947165
    }
    loc2 = {
        "lat": -33.93394265945938,
        "lng":  18.866166840635923
    }
    loc3 = {
        "lat": -33.964739490852224,
        "lng":  18.831907167622273
    }
    
    # use the main function to test with certain inputs
    # and don't need input from frontend the whole time
    calculate_midpoint(loc1, loc2, loc3)
    
    
# TODO: create test suite