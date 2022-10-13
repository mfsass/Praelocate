import sys
import unittest
from app import app
from app import calculate_midpoint

# mock testing
import unittest.mock as mock
from unittest.mock import patch

from app import find_suburb
from app import fuzzy_schools
from app import fuzzy_hospitals


class TestApp(unittest.TestCase):

    return_value = {
        "allCoordinates": [
            [-33.9313091, 18.8710578],
            [-33.9327763, 18.862542],
            [-34.0672638, 18.8582923],
        ],
        "allDistances": [2.31, 1.86, 18.94],
        "allTimes": [5.88, 5.43, 23.92],
        "avgDistance": 7.7,
        "avgTime": 11.74,
        "hospitals": [
            "Stellenbosch Provincial Hospital - Maternity Ward(Top)",
            "Stellenbosch Provincial Hospital",
            "Cheryl Doc Stellenboch",
            "Mediclinic Stellenbosch",
            "Mediclinic Stellenbosch Hospital & Mediclinic Stellenbosch Day Clinic",
            "Spescare Stellenbosch",
            "tygerberg university hospital",
            "Idas Valley Clinic",
            "Cloetesville Community Health Centre - Pharmacy",
            "Stellenbosch Medical Centre",
            "Medical Room",
            "Eerste River Hospital - A R V Clinic",
            "Helderberg Hospital",
            "Helderberg Hospital - A R V Clinic",
            "Day Hospital",
            "Mediclinic Vergelegen Hospital & Mediclinic Vergelegen Day Clinic",
            "Mediclinic Vergelegen-ER",
            "Cure Day Hospitals Somerset West",
            "Mediclinic Cape Gate Hospital & Mediclinic Cape Gate Day Clinic",
            "Strand Mediclinic Private Hospital-ER",
        ],
        "median": " (Welgevallen Experiment Farm) R2000000",
        "midpoint": {"lat": -33.9421670541999, "lng": 18.86680107142857},
        "schools": [
            "Paul Roos Gimnasium",
            "Rhenish Girls' High School",
            "Hoër Meisieskool Bloemhof",
            "Laerskool Eikestad",
            "Rhenish Primary School",
            "Hoërskool Stellenbosch",
            "Laerskool Af Louw",
            "Kayamandi Secondary School",
            "idasvalley primary school",
            "Lückhoff High School",
            "Primere Skool Idas Vallei",
            "Laerskool Cloetesville",
            "Kayamandi Primary School",
            "Makapula Secondary School",
            "Cloetesville High School",
            "Stellenzicht Secondary School",
            "Kylemore High School",
            "Kylemore Secondary School",
            "Helderberg High School",
            "Parel Vallei High School",
        ],
        "totalDistance": 23.11,
        "totalTime": 35.230000000000004,
    }

    @patch("app.locations")
    def test_fuzzy_schools(self, mock_locations):
        mock_locations.return_value = self.return_value
        origin_tuple = (
            self.return_value["midpoint"]["lat"],
            self.return_value["midpoint"]["lng"],
        )
        print("-------------------")
        print("--> fuzzy_schools() test passed")
        print("-------------------")
        self.assertEqual(fuzzy_schools(origin_tuple), self.return_value["schools"])

    @patch("app.locations")
    def test_fuzzy_hospitals(self, mock_locations):
        mock_locations.return_value = self.return_value
        origin_tuple = (
            self.return_value["midpoint"]["lat"],
            self.return_value["midpoint"]["lng"],
        )
        print("-------------------")
        print("--> fuzzy_hospitals() test passed")
        print("-------------------")
        self.assertEqual(fuzzy_hospitals(origin_tuple), self.return_value["hospitals"])

    @patch("app.locations")
    def test_suburb(self, mock_locations):
        mock_locations.return_value = self.return_value
        origin_tuple = (
            self.return_value["midpoint"]["lat"],
            self.return_value["midpoint"]["lng"],
        )
        self.assertEqual(find_suburb(origin_tuple), self.return_value["median"])
        print("-------------------")
        print("--> find_suburb() test passed")
        print("-------------------")


if __name__ == "__main__":
    unittest.main()
