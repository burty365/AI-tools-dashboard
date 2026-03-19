import { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function CarePlansPage() {
  const [message, setMessage] = useState("Checking connection...");

  useEffect(() => {
    const test = async () => {
      try {
        const { error, count } = await supabase
          .from("care_plans")
          .select("*", { count: "exact", head: true });

        if (error) {
          setMessage(`Supabase error: ${error.message}`);
          return;
        }

        setMessage(`Connected. care_plans rows: ${count ?? 0}`);
      } catch (err) {
        setMessage("Unexpected error talking to Supabase.");
        console.error(err);
      }
    };

    test();
  }, []);

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
          Back to Dashboard
        </button>

        <h1>Care Plans</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}