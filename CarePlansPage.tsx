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
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [planType, setPlanType] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Active");

  const loadPlans = async () => {
  console.log("🚀 loadPlans fired");

  try {
    setMessage("Loading care plans...");

    const { data, error } = await supabase
      .from("care_plans")
      .select(
        "id, customer_name, address, plan_type, next_service_date, payment_status"
      )
      .order("customer_name", { ascending: true });

    console.log("📦 Supabase response:", data, error);

    if (error) {
      console.error("❌ Supabase error:", error);
      setMessage("Error: " + error.message);
      return;
    }

    const rows = (data as CarePlan[]) || [];

    console.log("✅ Rows:", rows);

    setPlans(rows);

    if (rows.length === 0) {
      setMessage("No care plans found.");
      return;
    }

    setMessage("");
  } catch (err) {
    console.error("💥 CRASH:", err);
    setMessage("App crashed loading care plans.");
  }
};

  useEffect(() => {
    loadPlans();
  }, []);

  const resetForm = () => {
    setCustomerName("");
    setAddress("");
    setPlanType("");
    setNextServiceDate("");
    setPaymentStatus("Active");
  };

  const handleAddPlan = async () => {
    if (!customerName.trim()) {
      alert("Please enter a customer name.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("care_plans").insert([
      {
        customer_name: customerName.trim(),
        address: address.trim() || null,
        plan_type: planType.trim() || null,
        next_service_date: nextServiceDate || null,
        payment_status: paymentStatus || null,
      },
    ]);

    setSaving(false);

    if (error) {
      console.error("Insert error:", error);
      alert("Error saving care plan: " + error.message);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadPlans();
  };

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

          <button
            onClick={() => setShowForm((prev) => !prev)}
            style={buttonStyle}
          >
            {showForm ? "Close Form" : "Add Care Plan"}
          </button>
        </div>

        <h1 style={{ marginTop: 0 }}>Care Plans</h1>
        <p style={{ color: "#b7c5d9", marginBottom: "24px" }}>
          Boiler care plan customers and upcoming services.
        </p>

        {showForm && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>New Care Plan</h2>

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              style={inputStyle}
            />

            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              style={inputStyle}
            />

            <input
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              placeholder="Plan type"
              style={inputStyle}
            />

            <input
              type="date"
              value={nextServiceDate}
              onChange={(e) => setNextServiceDate(e.target.value)}
              style={inputStyle}
            />

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button onClick={handleAddPlan} style={buttonStyle} disabled={saving}>
              {saving ? "Saving..." : "Save Care Plan"}
            </button>
          </div>
        )}

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

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  marginBottom: "12px",
  boxSizing: "border-box" as const,
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