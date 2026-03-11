const API_BASE = "http://localhost:8000";

export async function getRiskDashboard() {
  const res = await fetch(`${API_BASE}/api/risk/dashboard`);
  if (!res.ok) {
    throw new Error("Failed to load dashboard");
  }
  return res.json();
}

export async function simulateScenario(input) {
  const res = await fetch(`${API_BASE}/api/risk/simulate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("Failed to simulate scenario");
  }

  return res.json();
}