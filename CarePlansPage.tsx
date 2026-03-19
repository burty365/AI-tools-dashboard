import { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

type CarePlan = {
  id: string;
  customer_name: string;
  address: string;
  plan_type: string;
  next_service_date: string | null;
  payment_status: string;
};

export default function CarePlansPage() {
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setErrorMessage("Timed out loading care plans.");
      }
    }, 8000);

    const loadPlans = async () => {
      try {
        const { data, error } = await supabase
          .from("care_plans")
          .select("id, customer_name, address, plan_type, next_service_date, payment_status")
          .order("customer_name", { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error("Error loading care plans:", error);
          setErrorMessage(error.message);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        setPlans((data as CarePlan[]) || []);
        setLoading(false);
        clearTimeout(timeout);
      } catch (err) {
        if (!isMounted) return;
        console.error("Unexpected care plans error:", err);
        setErrorMessage("Unexpected error loading care plans.");
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    loadPlans();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
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
          onClick={() => window.history.back()}
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

        {loading ? (
          <div
            style={{
              background: "#102348",
              padding: "20px",
              borderRadius: "14px",
            }}
          >
            Loading care plans...
          </div>
        ) : errorMessage ? (
          <div
            style={{
              background: "#102348",
              padding: "20px",
              borderRadius: "14px",
              color: "#ffb3b3",
            }}
          >
            {errorMessage}
          </div>
        ) : plans.length === 0 ? (
          <div
            style={{
              background: "#102348",
              padding: "20px",
              borderRadius: "14px",
            }}
          >
            No care plans found yet.
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
                    <td style={tdStyle}>{plan.address}</td>
                    <td style={tdStyle}>{plan.plan_type}</td>
                    <td style={tdStyle}>{plan.next_service_date || "—"}</td>
                    <td style={tdStyle}>{plan.payment_status}</td>
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