import React from "react";
import { forwardRef } from "react";
import { useEffect } from "react";
import { useState } from "react";

import { StandaloneSearchBox } from "@react-google-maps/api";

import "./inputBox.css";

const InputBox = forwardRef((props, ref) => {
  const [rankText, setRankText] = useState("Importance");
  const [shouldShow, setShouldShow] = useState(false);
  const [fuzzy, setFuzzy] = useState(false);
  const [title, setTitle] = useState("");
  const [rank, setRank] = useState(0);

  const { locationTitle, locationStr, locationTime } = ref;

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
      <div className="input label">
        <input
          className="input label title"
          type="text"
          ref={locationTitle}
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          placeholder="Enter title..."
        />
        <input
          name="check"
          type="checkbox"
          readOnly
          onClick={() => {
            setShouldShow(!shouldShow);
            setFuzzy(false);
          }}
        />
      </div>
      {shouldShow && (
        <div className="input wrapper">
          <StandaloneSearchBox>
            <input
              ref={locationStr}
              type="text"
              placeholder={"Enter your location here"}
              readOnly={fuzzy}
            ></input>
          </StandaloneSearchBox>
          {title.toLowerCase().includes("school") && (
            <div className="input wrapper school">
              <div className="input wrapper school label">
                <label>Are you unsure about specific schools?</label>
              </div>
              <div className="input wrapper school input">
                <input
                  type="checkbox"
                  onClick={() => {
                    props.setIsFuzzy(!fuzzy);
                    setFuzzy(!fuzzy);
                  }}
                />
              </div>
            </div>
          )}
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
            <div className="timeInput">
              <label>Arrival:</label>
              <input type="time" ref={locationTime} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default InputBox;
