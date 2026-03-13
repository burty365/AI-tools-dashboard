export default function App() {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#071535",
        color: "white",
        minHeight: "100vh",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <img
        src="/nuage-logo.png"
        alt="Nu Age Logo"
        style={{
          width: "420px",
          maxWidth: "90%",
          marginBottom: "30px",
        }}
      />

      <h1 style={{ marginBottom: "30px" }}>Nu Age AI Tools</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "18px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <button
          style={liveButton}
          onClick={() => window.open("PASTE_ROUTE_PLANNER_LINK_HERE", "_blank")}
        >
          Route Planner
        </button>

        <button
          style={liveButton}
          onClick={() => window.open("PASTE_GMAIL_CONVERTER_LINK_HERE", "_blank")}
        >
          Gmail Converter
        </button>

        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
        <button style={comingButton}>Coming Soon</button>
      </div>
    </div>
  );
}

const liveButton = {
  padding: "22px",
  borderRadius: "12px",
  border: "none",
  background: "#6cc04a",
  color: "white",
  fontSize: "18px",
  cursor: "pointer",
};

const comingButton = {
  padding: "22px",
  borderRadius: "12px",
  border: "none",
  background: "#334766",
  color: "#a7b4c8",
  fontSize: "18px",
};
