import React, { useState, forwardRef, useEffect } from "react";
import { StandaloneSearchBox } from "@react-google-maps/api";

import "./testComponent.css";

const TestComponent = forwardRef((props, ref) => {
  const [shouldShow, setShouldShow] = useState(false);
  const [rankText, setRankText] = useState("");

  const { locationStr, locationTime } = ref.current;

  useEffect(() => {
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
    <div className="box">
      <div className="input label">
        <label className="mainLabel">{props.label}</label>
        <input
          name="check"
          type="checkbox"
          readOnly
          onClick={() => setShouldShow(!shouldShow)}
        />
      </div>
      {shouldShow && (
        <div className="inputWrapper">
          <StandaloneSearchBox>
            <input
              ref={locationStr}
              type="text"
              placeholder={props.placeholder}
            ></input>
          </StandaloneSearchBox>
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
            <div className="timeInput">
              <label>Departure:</label>
              <input type="time" ref={locationTime} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default TestComponent;
