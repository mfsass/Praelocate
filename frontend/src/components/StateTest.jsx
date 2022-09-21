import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import InputTest from "./InputTest";
import Geocode from "react-geocode";

function StateTest() {
  const [locations, setLocations] = useState({});
  const [inputs, setInputs] = useState([]);
  const [count, setCount] = useState(0);
  const refs = useRef([]);

  // useEffect(() => {
  //   console.log("Refs:");
  //   console.log(refs.current);
  // }, [refs.current]);

  const onClick = (event, id, ref) => {
    setLocations({
      ...locations,
      [`location${id}`]: {
        coordinates: {
          lat: 0,
          lng: 0,
        },
        time: "12:00",
        rank: "4",
        shouldShowInfoWindow: false,
      },
    });
  };

  const getValues = () => {
    console.log(refs.current);
    refs.current.forEach((ref, index) => {
      console.log(`Input value [${index}]: ${ref.value}`);
    });
    console.log(locations);
  };

  const handleSave = (event) => {
    event.preventDefault();
    refs.current.forEach((string, index) => {
      try {
        console.log(`Trying: ${string.value}`);
      } catch (error) {
        console.log(`Aborting: ${string}`);
      }

      getGeoFromText(string.value, index, locations[`location${index}`]);
    });
  };

  // Praelexis (Pty) Ltd, Neutron Road, Techno Park, Stellenbosch, South Africa
  // Amsterdam Centraal, Stationsplein, Amsterdam, Netherlands

  const getGeoFromText = async (text, index, location) => {
    console.log(`Trying geo ${index}`);
    if (text && location.coordinates.lat === 0) {
      console.log(`Getting geo ${index}`);
      const promise = Geocode.fromAddress(text);

      console.log(`Waiting ${index}`);
      const response = await promise;
      console.log(response);
      let tempLocation = {
        ...locations[`location${index}`],
        coordinates: response.results[0].geometry.location,
      };
      console.log(tempLocation);
      console.log(`Setting: ${index}`);
      setLocations({
        ...locations,
        [`location${index}`]: tempLocation,
      });
      console.log(`Finished ${index}`);
      // Geocode.fromAddress(text).then(
      //   (response) => {
      //     const tempIndex2 = tempIndex;
      //     console.log(`Then ${tempIndex2}`);
      //     let tempLocation = {
      //       ...locations[`location${tempIndex2}`],
      //       coordinates: response.results[0].geometry.location,
      //     };
      //     console.log(tempLocation);
      //     console.log(`Setting: ${tempIndex2}`);
      //     setLocations({
      //       ...locations,
      //       [`location${tempIndex2}`]: tempLocation,
      //     });
      //     console.log(`Finished ${tempIndex}`);
      //   },
      //   (error) => {
      //     console.error(error);
      //   }
      // );
      // await sleep(1000);
    }
  };

  // useEffect(() => {
  //   console.log(`Count: ${count}`);
  //   console.log(`Locations:`);
  //   console.log(locations);
  // }, [count, locations]);

  /*
  lat, lng, str, time, ref, rank, label, infowindow
  */

  return (
    <>
      <label>Click to add a location</label>
      <button
        name="Work"
        onClick={(e) => {
          setInputs((state) => [
            ...state,
            <InputTest ref={(newRef) => refs.current.push(newRef)} />,
          ]);
          onClick(e, count);
          setCount(count + 1);
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
      <button onClick={getValues}>Click for list of input values</button>
      <button onClick={handleSave}>Click to save values</button>
    </>
  );
}

export default StateTest;
