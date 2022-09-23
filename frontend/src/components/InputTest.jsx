import React from "react";
import { forwardRef } from "react";
import { useEffect } from "react";
import { useState } from "react";

const InputTest = forwardRef((props, ref) => {
  const [rankText, setRankText] = useState("");

  useEffect(() => {
    console.log("Rank");
    switch (props.rank) {
      case 0:
        setRankText("Importance");
        break;
      case 1:
        setRankText("Not important");
        break;
      case 2:
        setRankText("Important");
        break;
      case 3:
        setRankText("Very important");
        break;
      case 4:
        setRankText("Integral");
        break;
      default:
        setRankText("");
        break;
    }
  }, [rankText, props.rank]);

  return (
    <>
      <label>Input here</label>
      <input type="text" ref={ref} />
      <div className="extraInput">
        <div className="bars">
          <input
            type="radio"
            name={"bars " + props.name}
            value="4"
            onClick={() => props.getRank(4, props.name)}
          />
          <input
            type="radio"
            name={"bars " + props.name}
            value="3"
            onClick={() => props.getRank(3, props.name)}
          />
          <input
            type="radio"
            name={"bars " + props.name}
            value="2"
            onClick={() => props.getRank(2, props.name)}
          />
          <input
            type="radio"
            name={"bars " + props.name}
            value="1"
            onClick={() => props.getRank(1, props.name)}
          />
          <span>{rankText}</span>
        </div>
      </div>
    </>
  );
});

export default InputTest;
