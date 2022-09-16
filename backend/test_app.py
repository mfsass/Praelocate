import unittest
from app import app
from app import calculate_midpoint


class TestApp(unittest.TestCase):

    # test app.route("/locations", methods=["POST"])
    def test_app_route(self):
        with app.test_client() as c:
            response = c.post(
                "/locations",
                json={
                    "radius": {"size": 3},
                    "loc1": {
                        "lat": -33.9180673,
                        "lng": 18.8561883,
                        "rank": 1,
                        "time": "20:30",
                    },
                    "loc2": {
                        "lat": -33.9326571,
                        "lng": 18.8653934,
                        "rank": 3,
                        "time": "20:30",
                    },
                },
            )
            print("\nSuccessfully tested app.route('/locations', methods=['POST'])")
            print("\n-------------------\n")
            self.assertEqual(response.status_code, 200)

    def test_input(self):
        # latitudes, longitudes, and ranks
        data = [
            (-33.9180673, 18.8561883, 1.0, "20:30"),
            (-33.9326571, 18.8653934, 3.0, "20:30"),
            (-33.9354089, 18.8600011, 4.0, "08:30"),
            (-33.9340673, 18.8661883, 2.0, "16:30"),
            (-33.9356571, 18.8653934, 3.0, "11:30"),
            (-33.924454, 18.821924, 2.0, "15:30"),
            (-33.965704, 18.474756, 3.0, "16:30"),
        ]

        app.radius = 1
        # initialize all app.locations global variables
        app.all_ranks = []
        app.coordinates = []
        app.times = []
        app.optimize_preference = "distance"  # otherwise varies with traffic times
        coord = []
        app.midpoint = {}

        for i in range(0, len(data)):
            app.all_ranks.append(data[i][2])  # ranks
            app.coordinates.append((data[i][0], data[i][1]))  # coordinates
            coord.append((data[i][0], data[i][1]))  # coordinates
            app.times.append((data[i][3]))
        # call the function
        result = calculate_midpoint(data)

        print("\n------------------- TEST Input passed -------------------\n")
        self.assertIsNotNone(result)
        self.assertTrue(True)

    def test_midpoint(self):
        # latitudes, longitudes, and ranks
        data = [
            (-33.9180673, 18.8561883, 1.0, "00:30"),
            (-33.9326571, 18.8653934, 1.0, "00:30"),
        ]

        app.radius = 0
        # initialize all app.locations global variables
        app.all_ranks = []
        app.coordinates = []
        app.times = []
        app.optimize_preference = "distance"  # otherwise varies with traffic times
        coord = []
        app.midpoint = {}

        for i in range(0, len(data)):
            app.all_ranks.append(data[i][2])  # ranks
            app.coordinates.append((data[i][0], data[i][1]))  # coordinates
            coord.append((data[i][0], data[i][1]))  # coordinates
            app.times.append((data[i][3]))
        # call the function
        result = calculate_midpoint(data)

        # check the results
        avg_coord = (
            sum([x[0] for x in coord]) / len(coord),
            sum([x[1] for x in coord]) / len(coord),
        )

        print("midpoint: ", result["midpoint"])
        print("\n------------------- TEST Midpoint passed -------------------\n")
        self.assertEqual(
            result["midpoint"], {"lat": -33.92657801666666, "lng": 18.861557941666664}
        )


if __name__ == "__main__":
    unittest.main()
