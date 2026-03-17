import { useState } from "react";

export default function App() {
  const [page, setPage] = useState<"home" | "comments">("home");
  const [comments, setComments] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addComment = () => {
    if (!input.trim()) return;
    setComments([input, ...comments]);
    setInput("");
  };

  // COMMENTS PAGE
  if (page === "comments") {
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          background: "#071535",
          color: "white",
          minHeight: "100vh",
          padding: "40px 20px",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
          Staff Comments
        </h1>

        <button
          style={{ ...liveButton, marginBottom: "20px" }}
          onClick={() => setPage("home")}
        >
          ← Back
        </button>

        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <textarea
            placeholder="Leave a comment, issue or idea..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              marginBottom: "10px",
            }}
          />

          <button style={liveButton} onClick={addComment}>
            Post Comment
          </button>

          <div style={{ marginTop: "20px" }}>
            {comments.length === 0 ? (
              <p>No comments yet</p>
            ) : (
              comments.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: "#334766",
                    padding: "12px",
                    borderRadius: "10px",
                    marginBottom: "10px",
                    textAlign: "left",
                  }}
                >
                  {c}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // HOME PAGE
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
          onClick={() => {
            window.open("https://nuage-route-planner.vercel.app", "_blank");
          }}
        >
          Route Planner
        </button>

        <button
          style={liveButton}
          onClick={() => setPage("comments")}
        >
          Comments
        </button>

        <button style={comingButton}>🔒 Gmail Converter</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
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
  fontWeight: "bold" as const,
};

const comingButton = {
  padding: "22px",
  borderRadius: "12px",
  border: "none",
  background: "#334766",
  color: "#a7b4c8",
  fontSize: "18px",
  cursor: "not-allowed",
  fontWeight: "bold" as const,
};
