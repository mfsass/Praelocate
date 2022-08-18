import { React, useState } from "react";
import LocationBox from "./LocationBox";

import "./locations.css";

function Locations() {
  const [location1, setLocation1] = useState("");
  const [location2, setLocation2] = useState("");
  const [location3, setLocation3] = useState("");
  const [data, setData] = useState([]);
  const [midpoint, setMidpoint] = useState("");

  const handleSubmit = (e) => {
    // location1.latitude = -33.93087933494542; -> eendrag
    // location1.longitude = 18.872240042486016;
    // location2.latitude = -33.93253245739606; -> neelsie
    // location2.longitude = 18.86538266947165;
    // Location 3 = -33.940743, 18.854595 Gino's
    e.preventDefault();
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location1: location1,
        location2: location2,
        location3: location3,
      }),
    };
    async function fetchFunc() {
      return await fetch("/locations", requestOpt)
        .then((response) => response.json())
        .catch((error) => console.log(error));
    }
    (async () => {
      let info = await fetchFunc();
      // alert("Time:" + info.time + " mins");
      // alert("Distance:" + info.distance + " km's");
      // alert(info.coordinates);
      setMidpoint(info.coordinates);
      setData(info);
    })();
  };

  return (
    <form className="locationForm" onSubmit={handleSubmit}>
      <LocationBox
        label="Location 1 (in Decimal Degrees)"
        passLocation={setLocation1}
      />
      <LocationBox
        label="Location 2 (in Decimal Degrees)"
        passLocation={setLocation2}
      />
      <LocationBox
        label="Location 3 (in Decimal Degrees)"
        passLocation={setLocation3}
      />
      <button className="location button" type="submit">
        Submit
      </button>

      <>
        <h3>
          Midpoint = {midpoint[0]}, {midpoint[1]}
        </h3>
        <table id="myTable" className="table table-available">
          <thead>
            <tr>
              <th>Location:</th>
              <th>Distances from Midpoint (kms)</th>
              <th>Travel time from Midpoint (mins)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(data).map((value, index) => {
              return (
                <tr>
                  <td>{data.allCoordinates[index]} </td>
                  <td>{data.allDistances[index]}</td>
                  <td>{data.allTimes[index]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </>
    </form>
  );
}

export default Locations;
