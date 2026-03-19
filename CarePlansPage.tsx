export default function CarePlansPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071535",
        color: "white",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#6cc04a",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Back
        </button>

        <h1>Care Plans</h1>
        <p>This page is live.</p>
      </div>
    </div>
  );
}