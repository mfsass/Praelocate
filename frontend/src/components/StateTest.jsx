import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import InputTest from "./InputTest";

function StateTest() {
  const [locations, setLocations] = useState({});
  const [count, setCount] = useState(0);

  const [inputs, setInputs] = useState([]);

  const onClick = (event, id) => {
    setLocations({
      ...locations,
      [`location${id}`]: {
        coordinates: {
          lat: 18,
          lng: 19,
        },
        str: "Endler",
        time: "12:00",
        rank: "4",
        shouldShowInfoWindow: false,
      },
    });
  };

  useEffect(() => {
    console.log(`Count: ${count}`);
    console.log(`Locations:`);
    console.log(locations);
  }, [count, locations]);

  /*
  lat, lng, str, time, ref, rank, label, infowindow
  */

  return (
    <>
      <label>Click to add a location</label>
      <button
        name="Work"
        onClick={(e) => {
          onClick(e, count);
          setCount(count + 1);
          setInputs((state) => [...state, <InputTest />]);
        }}
      >
        +
      </button>
      <div className="testInputs">
        {inputs.map((input, index) => {
          return (
            <div className="box" key={index}>
              {input}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default StateTest;
