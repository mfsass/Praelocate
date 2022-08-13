import "./App.css";
import home from "./home-alt.svg";

import Locations from "./components/Locations";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Home Location Tool</h1>
        <p>
          Enter your important locations and see where your dream home might be
        </p>
      </header>
      <body>
        <img src={home} className="App-logo" alt="logo" />
        <Locations></Locations>
      </body>
    </div>
  );
}

export default App;
