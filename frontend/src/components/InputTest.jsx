import React from "react";
import { forwardRef } from "react";
import { useEffect } from "react";
import { useState } from "react";

const InputTest = forwardRef((props, ref) => {
  const [rankText, setRankText] = useState("Importance");
  const [rank, setRank] = useState(0);

  useEffect(() => {
    if (rank > 0) {
      switch (rank) {
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
    }
  }, [rankText, rank]);

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
            onClick={() => {
              props.changeRank(props.name, 4, props.locations);
              setRank(4);
            }}
          />
          <input
            type="radio"
            name={"bars " + props.name}
            value="3"
            onClick={() => {
              props.changeRank(props.name, 3);
              setRank(3);
            }}
          />
          <input
            type="radio"
            name={"bars " + props.name}
            value="2"
            onClick={() => {
              props.changeRank(props.name, 2);
              setRank(2);
            }}
          />
          <input
            type="radio"
            name={"bars " + props.name}
            value="1"
            onClick={() => {
              props.changeRank(props.name, 1);
              setRank(1);
            }}
          />
          <span>{rankText}</span>
        </div>
      </div>
    </>
  );
});

export default InputTest;
