import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useReducer } from "react";

import InputTest from "./InputTest";

const initialState = [
  {
    radius: 1,
  },
  {
    preference: "time",
  },
  { locations: {} },
];

const reducer = (state, action) => {
  return {
    ...state,
    [`location${action.id}`]: { id: action.id, name: action.name },
  };
};

function StateTest2() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [number, setNumber] = useState(0);

  const [inputs, setInputs] = useState([<InputTest />]);

  useEffect(() => {
    console.log(state);
  }, [state]);

  /*
  lat, lng, str, time, ref, rank, label, infowindow
  */

  return (
    <>
      <label>Click the button</label>
      <button
        name="Work"
        onClick={(e) => {
          dispatch({ id: number, name: e.currentTarget.name });
          setNumber(number + 1);
          setInputs((state) => [...state, <InputTest />]);
        }}
      >
        Click me
      </button>
      <div>
        {inputs.map((tag, index) => {
          return (
            <div className="box" key={index}>
              {tag}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default StateTest2;
