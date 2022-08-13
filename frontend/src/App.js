import "./App.css";
import home from "./home-alt.svg";

function App() {
  let location1 = { latitude: "", longitude: "" };
  let location2 = { latitude: "", longitude: "" };
  let location3 = { latitude: "", longitude: "" };

  const handleChange = (event, location, isLatitude) => {
    if (isLatitude) {
      location.latitude = event.target.value;
    } else location.longitude = event.target.value;
    console.log(`${location}: `, location);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requestOpt = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location1: location1,
        location2: location2,
        location3: location3,
      }),
    };
    async function fetchFunc() {
      return await fetch("/locations", requestOpt)
        .then((response) => response.json())
        .catch((error) => console.log(error));
    }
    (async () => {
      let info = await fetchFunc();
      alert(JSON.stringify(info));
    })();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Home Location Tool</h1>
      </header>
      <body>
        <img src={home} className="App-logo" alt="logo" />
        <form onSubmit={handleSubmit}>
          <div className="location container">
            <label>First location</label>
            <div className="location input">
              <input
                name="loc1lat"
                type="text"
                onChange={(event) => handleChange(event, location1, true)}
                placeholder="latitude"
                autoComplete="off"
              />
              <input
                name="loc1lon"
                type="text"
                onChange={(event) => handleChange(event, location1, false)}
                placeholder="longitude"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="location container">
            <label>Second location</label>
            <div className="location input">
              <input
                name="loc2lat"
                type="text"
                onChange={(event) => handleChange(event, location2, true)}
                placeholder="latitude"
                autoComplete="off"
              />
              <input
                name="loc2lon"
                type="text"
                onChange={(event) => handleChange(event, location2, false)}
                placeholder="longitude"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="location container">
            <label>Third location</label>
            <div className="location input">
              <input
                name="loc3lat"
                type="text"
                onChange={(event) => handleChange(event, location3, true)}
                placeholder="latitude"
                autoComplete="off"
              />
              <input
                name="loc3lon"
                type="text"
                onChange={(event) => handleChange(event, location3, false)}
                placeholder="longitude"
                autoComplete="off"
              />
            </div>
          </div>
          <button className="location button" type="submit">
            Submit
          </button>
        </form>
      </body>
    </div>
  );
}

export default App;
