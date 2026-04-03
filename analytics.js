let chart;

function goBack() {
  window.location.href = "index.html";
}

function showEmptyState() {
  const el = document.getElementById("emptyState");
  if (el) el.style.display = "block";
}

function buildAnalytics() {
  try {
    const raw = localStorage.getItem("splitvillaState");
    if (!raw) {
      showEmptyState();
      return;
    }

    const data = JSON.parse(raw);
    const members = Array.isArray(data.members) ? data.members : [];
    const expenses = Array.isArray(data.expenses) ? data.expenses : [];

    if (members.length === 0 || expenses.length === 0) {
      showEmptyState();
      return;
    }

    const paidMap = {};
    members.forEach((m) => {
      paidMap[m.name] = 0;
    });

    expenses.forEach((e) => {
      if (!Object.prototype.hasOwnProperty.call(paidMap, e.payer)) {
        paidMap[e.payer] = 0;
      }
      paidMap[e.payer] += Number(e.amt) || 0;
    });

    const labels = Object.keys(paidMap);
    const values = Object.values(paidMap);
    if (labels.length === 0) {
      showEmptyState();
      return;
    }

    const palette = ["#86efac", "#4ade80", "#22c55e", "#a3e635", "#84cc16", "#65a30d"];
    const ctx = document.getElementById("chart");
    if (!ctx) return;

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => palette[i % palette.length]),
            borderColor: "rgba(134, 239, 172, 0.25)",
            borderWidth: 1,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#b7d7c2",
              boxWidth: 10,
              boxHeight: 10
            }
          }
        }
      }
    });
  } catch (e) {
    console.error("Failed to build analytics", e);
    showEmptyState();
  }
}

document.addEventListener("DOMContentLoaded", buildAnalytics);
