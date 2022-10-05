import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import InputTest from "./InputTest";
import Geocode from "react-geocode";

function StateTest() {
  const titleRefs = useRef([]);
  const stringRefs = useRef([]);
  const timeRefs = useRef([]);
  const [locations, setLocations] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [count, setCount] = useState(0);
  const [ranks, setRanks] = useState(Array(20).fill(-1));
  const [isFuzzy, setIsFuzzy] = useState(false);

  /*
    Prints the current state of this component
  */
  const getValues = () => {
    console.log("*** Title refs: ***");
    console.log(titleRefs.current);
    titleRefs.current.forEach((ref, index) => {
      console.log(`Title value [${index}]: ${ref.value}`);
    });

    console.log("*** String refs: ***");
    console.log(stringRefs.current);
    stringRefs.current.forEach((ref, index) => {
      console.log(`Input value [${index}]: ${ref.value}`);
    });

    console.log("*** Time refs: ***");
    console.log(timeRefs.current);
    timeRefs.current.forEach((ref, index) => {
      console.log(`Time value [${index}]: ${ref.value}`);
    });

    console.log("*** Ranks: ***");
    console.log(ranks);
    console.log("*** Locations: ***");
    console.log(locations);

    console.log(`*** Is fuzzy? ${isFuzzy} ***`);
  };

  const addInput = () => {
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

    // Adds new refs for the input components
    let lastTitleRef = (ref0) => titleRefs.current.push(ref0);
    let lastStringRef = (ref1) => stringRefs.current.push(ref1);
    let lastTimeRef = (ref2) => timeRefs.current.push(ref2);

    setInputs((state) => [
      ...state,
      <InputTest
        ref={{
          locationTitle: lastTitleRef,
          locationStr: lastStringRef,
          locationTime: lastTimeRef,
        }}
        changeRank={changeRank}
        name={count}
        setIsFuzzy={setIsFuzzy}
      />,
    ]);

    setCount(count + 1);
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
  };

  /**
   * Saves all the values and requests the coordinates from the google maps API
   */
  const handleSave = (event) => {
    event.preventDefault();

    stringRefs.current.forEach(async (string, index) => {
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
          coordinates: response.coordinates,
          label: getLabel(stringRefs.current[index2].value),
          shouldShow: true,
          rank: ranks[index2],
          time: timeRefs.current[index2].value,
          title: titleRefs.current[index2].value,
        };

        setLocations((state) => ({
          ...state,
          [`${index2}`]: tempLocation,
        }));
      });
    });
  };

  const getLabel = (value) => {
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
      <button name="Work" onClick={addInput}>
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
