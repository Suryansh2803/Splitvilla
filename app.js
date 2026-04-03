let members = [];
let expenses = [];

const pageTitles = {
  landing: "Home",
  dashboard: "Dashboard",
  members: "Members",
  expenses: "Expenses",
  chat: "Team Chat"
};

function setPageLabel(id) {
  const el = document.getElementById("pageLabel");
  if (!el) return;
  el.innerText = pageTitles[id] || "Splitvilla";
}

function saveState() {
  try {
    localStorage.setItem("splitvillaState", JSON.stringify({ members, expenses }));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem("splitvillaState");
    if (!raw) return;
    const data = JSON.parse(raw);
    members = Array.isArray(data.members) ? data.members : [];
    expenses = Array.isArray(data.expenses) ? data.expenses : [];

    const membersList = document.getElementById("membersList");
    const payerSelect = document.getElementById("payer");
    const expList = document.getElementById("expList");
    membersList.innerHTML = "";
    payerSelect.innerHTML = "";
    expList.innerHTML = "";

    members.forEach((m) => {
      const div = document.createElement("div");
      div.className = "member";
      div.innerHTML = `<img src="${m.photo}">${m.name}`;
      membersList.appendChild(div);

      const opt = document.createElement("option");
      opt.value = m.name;
      opt.innerText = m.name;
      payerSelect.appendChild(opt);
    });

    expenses.forEach((e) => {
      const li = document.createElement("li");
      li.innerText = `${e.payer} paid ₹${e.amt} for ${e.desc}`;
      expList.appendChild(li);
    });

    document.getElementById("membersCount").innerText = members.length;
    const metricMembers = document.getElementById("metricMembers");
    if (metricMembers) metricMembers.innerText = members.length;

    updateDashboard();
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

function show(id) {
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.body.classList.toggle("landing-mode", id === "landing");
  setPageLabel(id);
}

function goToAnalytics() {
  window.location.href = "analytics.html";
}

function addMember() {
  const name = document.getElementById("name").value;
  const photo = document.getElementById("photo").value || "https://via.placeholder.com/40";

  members.push({ name, photo });
  document.getElementById("membersCount").innerText = members.length;
  document.getElementById("metricMembers").innerText = members.length;

  saveState();

  const div = document.createElement("div");
  div.className = "member";
  div.innerHTML = `<img src="${photo}">${name}`;
  document.getElementById("membersList").appendChild(div);

  const opt = document.createElement("option");
  opt.value = name;
  opt.innerText = name;
  document.getElementById("payer").appendChild(opt);
}

function addExpense() {
  const desc = document.getElementById("desc").value;
  const amt = Number(document.getElementById("amt").value);
  const payer = document.getElementById("payer").value;

  expenses.push({ desc, amt, payer });

  const li = document.createElement("li");
  li.innerText = `${payer} paid ₹${amt} for ${desc}`;
  document.getElementById("expList").appendChild(li);

  updateDashboard();
  saveState();
}

function updateDashboard() {
  const total = expenses.reduce((sum, e) => sum + e.amt, 0);
  document.getElementById("total").innerText = "₹" + total;
  const metricTotalEl = document.getElementById("metricTotal");
  if (metricTotalEl) metricTotalEl.innerText = "₹" + total;
}

function sendMsg() {
  const msg = document.getElementById("msg").value;
  const div = document.createElement("div");
  div.innerText = msg;
  document.getElementById("chatBox").appendChild(div);
}

document.addEventListener("DOMContentLoaded", loadState);
