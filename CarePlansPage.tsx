import { useEffect, useState } from "react";
import { supabase } from "./src/lib/supabase";

export default function CarePlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPlans() {
    const { data } = await supabase.from("care_plans").select("*");
    setPlans(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPlans();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Care Plans</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Plan</th>
              <th>Next Service</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td>{plan.customer_name}</td>
                <td>{plan.address}</td>
                <td>{plan.plan_type}</td>
                <td>{plan.next_service_date}</td>
                <td>{plan.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}