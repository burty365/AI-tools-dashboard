type Props = {
  onBack: () => void;
};

export default function CarePlansPage({ onBack }: Props) {
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
          onClick={onBack}
          style={{
            marginBottom: "20px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "none",
            background: "#6cc04a",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Back to Dashboard
        </button>

        <h1>Care Plans</h1>
        <p>Care Plans page is working.</p>
      </div>
    </div>
  );
}