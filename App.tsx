export default function App() {
  return (
    <div style={{
      fontFamily: "Arial",
      background: "#0f172a",
      color: "white",
      minHeight: "100vh",
      textAlign: "center",
      padding: "40px"
    }}>

      <img 
https://i.postimg.cc/sDbHQkRq/Whats-App-Image-2026-01-14-at-13-43-45.jpg        alt="Nu Age Logo"
        style={{width:"320px", marginBottom:"40px"}}
      />

      <h1>Nu Age AI Tools</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
        gap: "20px",
        maxWidth: "900px",
        margin: "auto"
      }}>

        <button style={liveButton}>Route Planner</button>

        <button style={liveButton}>Gmail Converter</button>

        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>

      </div>

    </div>
  )
}

const liveButton = {
  padding: "25px",
  borderRadius: "10px",
  border: "none",
  background: "#6cc04a",
  color: "white",
  fontSize: "18px",
  cursor: "pointer"
}

const comingButton = {
  padding: "25px",
  borderRadius: "10px",
  border: "none",
  background: "#334155",
  color: "#94a3b8",
  fontSize: "18px"
}
