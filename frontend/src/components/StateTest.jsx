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
  const [ranks, setRanks] = useState([]);

  // useEffect(() => {
  //   console.log("Refs:");
  //   console.log(refs.current);
  // }, [refs.current]);

  const onClick = async (event, id, ref) => {
    console.log("First");

    console.log("Second");
    return;
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

    refs.current.forEach(async (string, index) => {
      try {
        console.log(`Trying: ${string.value}`);
      } catch (error) {
        console.log(`Aborting: ${string}`);
      }

      getGeoFromText(string.value, index).then((response) => {
        const index = response.index;
        const tempLocation = {
          ...locations[`location${index}`],
          coordinates: response.coordinates,
        };
        setLocations((state) => ({
          ...state,
          [`location${index}`]: tempLocation,
        }));
      });
    });
  };

  // Praelexis (Pty) Ltd, Neutron Road, Techno Park, Stellenbosch, South Africa
  // Amsterdam Centraal, Stationsplein, Amsterdam, Netherlands

  const getGeoFromText = async (text, index) => {
    console.log(`Trying geo ${index}`);
    if (text) {
      return await Geocode.fromAddress(text).then(
        (response) => {
          return {
            index: index,
            coordinates: response.results[0].geometry.location,
          };
        },
        (error) => {
          console.error(error);
        }
      );
    }
  };

  const getRank = (value, name) => {
    console.log(`Changing value to ${value} of ${name}`);
    console.log(ranks);
    setRanks(() => (ranks[name] = value));
    setRanks((latest) => console.log(latest));
  };

  /*
  lat, lng, str, time, ref, rank, label, infowindow
  */

  return (
    <>
      <label>Click to add a location</label>
      <button
        name="Work"
        onClick={async (e) => {
          console.log("Count: ", count);

          setRanks(() => ranks.push(""));

          setInputs((state) => [
            ...state,
            <InputTest
              ref={(newRef) => refs.current.push(newRef)}
              getRank={getRank}
              rank={ranks[count]}
              name={count}
            />,
          ]);

          let tempLocation = {
            ...locations[`location${count}`],
            coordinates: {
              lat: 0,
              lng: 0,
            },
            time: "12:00",
            shouldShowInfoWindow: false,
          };

          setLocations({
            ...locations,
            [`location${count}`]: tempLocation,
          });
          setCount(count + 1);
          console.log("Fourth");
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
