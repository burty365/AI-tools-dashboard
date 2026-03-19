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
  const [message, setMessage] = useState("Loading care plans...");

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("care_plans")
          .select(
            "id, customer_name, address, plan_type, next_service_date, payment_status"
          )
          .order("customer_name", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          setMessage("Supabase error: " + error.message);
          return;
        }

        const rows = (data as CarePlan[]) || [];
        setPlans(rows);

        if (rows.length === 0) {
          setMessage("No care plans found.");
          return;
        }

        setMessage("");
      } catch (err) {
        console.error("Unexpected care plans error:", err);
        setMessage("Unexpected error talking to Supabase.");
      }
    };

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
        <button
          onClick={onBack}
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

        <h1 style={{ marginTop: 0 }}>Care Plans</h1>
        <p style={{ color: "#b7c5d9", marginBottom: "24px" }}>
          Boiler care plan customers and upcoming services.
        </p>

        {message ? (
          <div
            style={{
              background: "#102348",
              padding: "20px",
              borderRadius: "14px",
            }}
          >
            {message}
          </div>
        ) : (
          <div
            style={{
              background: "#102348",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                color: "white",
              }}
            >
              <thead>
                <tr style={{ background: "#0b1a38" }}>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Address</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Next Service</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} style={{ borderTop: "1px solid #1a2d57" }}>
                    <td style={tdStyle}>{plan.customer_name}</td>
                    <td style={tdStyle}>{plan.address || "—"}</td>
                    <td style={tdStyle}>{plan.plan_type || "—"}</td>
                    <td style={tdStyle}>{plan.next_service_date || "—"}</td>
                    <td style={tdStyle}>{plan.payment_status || "—"}</td>
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

const thStyle = {
  textAlign: "left" as const,
  padding: "14px",
  fontSize: "14px",
};

const tdStyle = {
  padding: "14px",
  fontSize: "14px",
};