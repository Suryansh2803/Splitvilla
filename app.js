let members = [];
let expenses = [];
let editingExpenseIndex = null;
let payment = {
  accountName: "",
  upiId: "",
  qrDataUrl: ""
};

const pageTitles = {
  landing: "Home",
  dashboard: "Dashboard",
  members: "Members",
  expenses: "Expenses",
  chat: "Team Chat",
  contact: "Contact"
};

function setPageLabel(id) {
  const el = document.getElementById("pageLabel");
  if (!el) return;
  el.innerText = pageTitles[id] || "Splitvilla";
}

function saveState() {
  try {
    localStorage.setItem("splitvillaState", JSON.stringify({ members, expenses, payment }));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

function applyHashRoute() {
  const hash = (window.location.hash || "").replace("#", "").trim();
  const sectionIds = ["landing", "dashboard", "members", "expenses", "chat", "contact"];
  if (sectionIds.includes(hash)) {
    show(hash);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem("splitvillaState");
    if (raw) {
      const data = JSON.parse(raw);
      members = Array.isArray(data.members) ? data.members : [];
      expenses = Array.isArray(data.expenses) ? data.expenses : [];
      payment = data && typeof data.payment === "object" && data.payment
        ? {
            accountName: String(data.payment.accountName || ""),
            upiId: String(data.payment.upiId || ""),
            qrDataUrl: String(data.payment.qrDataUrl || "")
          }
        : payment;
    }

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

    renderExpenses();

    document.getElementById("membersCount").innerText = members.length;
    const metricMembers = document.getElementById("metricMembers");
    if (metricMembers) metricMembers.innerText = members.length;

    updateDashboard();

    hydratePaymentUI();
    applyHashRoute();
  } catch (e) {
    console.error("Failed to load state", e);
  }
}

function renderExpenses() {
  const expList = document.getElementById("expList");
  if (!expList) return;
  expList.innerHTML = "";

  expenses.forEach((e, idx) => {
    const li = document.createElement("li");
    li.className = "expense-item";

    const left = document.createElement("div");
    left.className = "expense-left";
    left.innerText = `${e.payer} paid ₹${e.amt} for ${e.desc}`;

    const actions = document.createElement("div");
    actions.className = "expense-item-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "expense-mini-btn";
    editBtn.type = "button";
    editBtn.innerText = "Edit";
    editBtn.addEventListener("click", () => startEditExpense(idx));

    actions.appendChild(editBtn);
    li.appendChild(left);
    li.appendChild(actions);
    expList.appendChild(li);
  });
}

function startEditExpense(index) {
  const e = expenses[index];
  if (!e) return;
  editingExpenseIndex = index;

  const descEl = document.getElementById("desc");
  const amtEl = document.getElementById("amt");
  const payerEl = document.getElementById("payer");
  if (descEl) descEl.value = e.desc || "";
  if (amtEl) amtEl.value = Number(e.amt) || 0;
  if (payerEl) payerEl.value = e.payer || "";

  const submit = document.getElementById("expenseSubmit");
  const cancel = document.getElementById("expenseCancel");
  if (submit) submit.innerText = "Save";
  if (cancel) cancel.style.display = "inline-flex";
}

function cancelEditExpense() {
  editingExpenseIndex = null;
  const descEl = document.getElementById("desc");
  const amtEl = document.getElementById("amt");
  if (descEl) descEl.value = "";
  if (amtEl) amtEl.value = "";

  const submit = document.getElementById("expenseSubmit");
  const cancel = document.getElementById("expenseCancel");
  if (submit) submit.innerText = "Add";
  if (cancel) cancel.style.display = "none";
}

function clearExpenses() {
  if (!expenses.length) return;
  const ok = window.confirm("Clear all expenses? This cannot be undone.");
  if (!ok) return;
  expenses = [];
  cancelEditExpense();
  renderExpenses();
  updateDashboard();
  saveState();
}

function show(id) {
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.body.classList.toggle("landing-mode", id === "landing");
  setPageLabel(id);

  if (window.location.hash !== "#" + id) {
    window.location.hash = id;
  }
}

function goToAnalytics() {
  window.location.href = "analytics.html";
}

function hydratePaymentUI() {
  const nameEl = document.getElementById("contactName");
  const upiEl = document.getElementById("contactUpi");
  const qrPreview = document.getElementById("qrPreview");
  const qrEmpty = document.getElementById("qrEmpty");
  const qrUpload = document.getElementById("qrUpload");

  if (nameEl) nameEl.value = payment.accountName || "";
  if (upiEl) upiEl.value = payment.upiId || "";

  if (qrPreview && qrEmpty) {
    const hasQr = Boolean(payment.qrDataUrl);
    qrPreview.style.display = hasQr ? "block" : "none";
    qrEmpty.style.display = hasQr ? "none" : "block";
    if (hasQr) qrPreview.src = payment.qrDataUrl;
  }

  if (qrUpload && !qrUpload.dataset.bound) {
    qrUpload.dataset.bound = "true";
    qrUpload.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      payment.qrDataUrl = dataUrl;
      saveState();
      hydratePaymentUI();
    });
  }
}

function savePaymentDetails() {
  const nameEl = document.getElementById("contactName");
  const upiEl = document.getElementById("contactUpi");
  payment.accountName = nameEl ? String(nameEl.value || "").trim() : payment.accountName;
  payment.upiId = upiEl ? String(upiEl.value || "").trim() : payment.upiId;
  saveState();
}

async function copyUpi() {
  const upi = String((payment && payment.upiId) || "").trim();
  if (!upi) return;
  try {
    await navigator.clipboard.writeText(upi);
  } catch (e) {
    console.error("Failed to copy UPI", e);
  }
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

  if (editingExpenseIndex !== null && expenses[editingExpenseIndex]) {
    expenses[editingExpenseIndex] = { desc, amt, payer };
    cancelEditExpense();
  } else {
    expenses.push({ desc, amt, payer });
  }

  renderExpenses();

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

window.addEventListener("hashchange", applyHashRoute);
