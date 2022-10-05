import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import InputTest from "./InputTest";
import Geocode from "react-geocode";

function StateTest() {
  const [locations, setLocations] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [count, setCount] = useState(0);
  const refs = useRef([]);
  const [ranks, setRanks] = useState(Array(5).fill(-1));
  const [lastRank, setLastRank] = useState({
    shouldUpdate: false,
    index: -1,
    value: -1,
  });

  /*
    Prints the current state of this component
  */
  const getValues = () => {
    console.log("Refs:");
    console.log(refs.current);
    refs.current.forEach((ref, index) => {
      console.log(`Input value [${index}]: ${ref.value}`);
    });
    console.log("Ranks:");
    console.log(ranks);
    console.log("Locations:");
    console.log(locations);
  };

  /*
    Called by the child
    !** important **! does not have the state of the parent
  */
  const changeRank = (index, value) => {
    console.log(`Changing rank ${index} to ${value}`);
    setRanks(
      ranks.map((item, i) => {
        if (i === index) {
          console.log("Changing");
          item = value;
          return item;
        } else {
          console.log("Not changing");
          return item;
        }
      })
    );
    setLastRank({
      value: value,
      index: index,
      shouldUpdate: true,
    });
  };

  /* When a location's rank has been changed, sets that value for that 
    location in the locations object
   */
  useEffect(() => {
    if (lastRank.shouldUpdate) {
      console.log("Locations:::");
      console.log(locations[lastRank.index]);
      const tempLocation = {
        ...locations[lastRank.index],
      };
      tempLocation.rank = lastRank.value;

      setLocations((state) => ({
        ...state,
        [`${lastRank.index}`]: tempLocation,
      }));

      setLastRank({ ...lastRank, shouldUpdate: false });
    }
  }, [ranks, lastRank, locations]);

  const handleSave = (event) => {
    event.preventDefault();

    refs.current.forEach(async (string, index) => {
      try {
        console.log(`Trying: ${string.value}`);
      } catch (error) {
        console.log(`Aborting: ${string}`);
      }

      getGeoFromText(string.value, index).then((response) => {
        console.log(`Response: ${response.index}`);
        const index2 = response.index;
        const tempLocation = {
          ...locations[index2],
        };

        tempLocation.coordinates = response.coordinates;
        tempLocation.label = replaceText(refs.current[index2].value);
        tempLocation.shouldShow = true;

        setLocations((state) => ({
          ...state,
          [`${index2}`]: tempLocation,
        }));
      });
    });
  };

  const replaceText = (value) => {
    return value.substring(0, value.indexOf(","));
  };

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

  /*
  lat, lng, str, time, ref, rank, label, infowindow
  */

  return (
    <>
      <label>Click to add a location</label>
      <button
        name="Work"
        onClick={(e) => {
          console.log(`Count: ${count}`);

          setLocations([
            ...locations,
            {
              id: count,
              coordinates: {
                lat: 0,
                lng: 0,
              },
              title: "",
              label: "",
              time: "12:00",
              shouldShow: false,
              rank: -1,
            },
          ]);

          setInputs((state) => [
            ...state,
            <InputTest
              ref={(newRef) => refs.current.push(newRef)}
              changeRank={changeRank}
              name={count}
            />,
          ]);

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
