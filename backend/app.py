from flask import Flask, jsonify, request
from flask_cors import cross_origin, CORS
import logging
app = Flask(__name__)
CORS(app)

@app.route('/locations', methods = ['POST'])
@cross_origin()
def locations():
    loc1 = request.json['location1']
    loc2 = request.json['location2']
    loc3 = request.json['location3']
    output = loc1
    
    return output