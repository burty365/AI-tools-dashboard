import { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

type CarePlan = {
  id: string;
  customer_name: string;
  address: string | null;
  plan_type: string | null;
  next_service_date: string | null;
  payment_status: string | null;
};

type Props = {
  onBack: () => void;
};

export default function CarePlansPage({ onBack }: Props) {
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [message, setMessage] = useState("Starting...");
  const [debug, setDebug] = useState("Not started");

  const loadPlans = async () => {
    setMessage("Loading care plans...");
    setDebug("Step 1: loadPlans started");

    try {
      setDebug("Step 2: checking Supabase query");

      const { data, error } = await supabase
        .from("care_plans")
        .select(
          "id, customer_name, address, plan_type, next_service_date, payment_status"
        )
        .order("customer_name", { ascending: true });

      if (error) {
        setDebug(`Step 3: Supabase error - ${error.message}`);
        setMessage(`Error: ${error.message}`);
        return;
      }

      const rows = (data as CarePlan[]) || [];
      setPlans(rows);

      if (rows.length === 0) {
        setDebug("Step 3: query worked, no rows found");
        setMessage("No care plans found.");
        return;
      }

      setDebug(`Step 3: query worked, rows found = ${rows.length}`);
      setMessage("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown crash";
      setDebug(`Step 3: crashed - ${errorMessage}`);
      setMessage(`App crashed: ${errorMessage}`);
    }
  };

  useEffect(() => {
    loadPlans();
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
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <button onClick={onBack} style={buttonStyle}>
            Back to Dashboard
          </button>
        </div>

        <h1 style={{ marginTop: 0 }}>Care Plans Debug</h1>
        <p style={{ color: "#b7c5d9", marginBottom: "12px" }}>
          Boiler care plan customers and upcoming services.
        </p>

        <div style={debugStyle}>
          <strong>Debug:</strong> {debug}
        </div>

        {message ? (
          <div style={cardStyle}>{message}</div>
        ) : (
          <div style={cardStyle}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Address</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Next Service</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id}>
                    <td style={tdStyle}>{p.customer_name}</td>
                    <td style={tdStyle}>{p.address || "-"}</td>
                    <td style={tdStyle}>{p.plan_type || "-"}</td>
                    <td style={tdStyle}>{p.next_service_date || "-"}</td>
                    <td style={tdStyle}>{p.payment_status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#6cc04a",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const cardStyle = {
  background: "#102348",
  padding: "20px",
  borderRadius: "14px",
  marginBottom: "20px",
};

const debugStyle = {
  background: "#3a2a12",
  color: "#ffd27a",
  padding: "14px",
  borderRadius: "14px",
  marginBottom: "20px",
};

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #1a2d57",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #1a2d57",
};