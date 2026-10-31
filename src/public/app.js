const form = document.getElementById("ofrenda-form");
const statusEl = document.getElementById("status");
const altar = document.getElementById("altar");
const lightBtn = document.getElementById("light");
const sampleBtn = document.getElementById("sample");
const historyEl = document.getElementById("history");

const SAMPLE = {
  name: "Rosa Elena Vargas",
  relationship: "Abuela",
  years: "1938–2021",
  foods: "pan de muerto\ncafe de olla\nmole negro",
  songs: "Cielito Lindo\nLas Mañanitas",
  stories:
    "She kept a tin of cinnamon by the stove and tapped it twice before coffee.\nEvery November she set out orange marigolds and a glass of water for visitors who could not stay.\nShe taught me to mend a hem by candlelight when the power went out.",
};

sampleBtn.addEventListener("click", () => {
  for (const [key, value] of Object.entries(SAMPLE)) {
    form.elements[key].value = value;
  }
  setStatus("Sample notes loaded. Nothing leaves this machine.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  lightBtn.disabled = true;
  setStatus("Lighting with local Gemma…");
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/remember", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not light the ofrenda.");
    renderAltar(data);
    setStatus(`Grounded on ${data.model}. Retry count: ${data.retries}.`, "ok");
    await loadHistory();
  } catch (error) {
    setStatus(error.message || "Request failed.", "bad");
  } finally {
    lightBtn.disabled = false;
  }
});

historyEl.addEventListener("click", (event) => {
  const item = event.target.closest("[data-run]");
  if (!item) return;
  const run = JSON.parse(item.dataset.run);
  renderAltar(run);
  setStatus("Restored an earlier light from local history.", "ok");
});

function renderAltar(run) {
  altar.hidden = false;
  document.getElementById("altar-meta").textContent = [
    run.person.relationship,
    run.person.years,
    run.grounded ? "source-checked" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  document.getElementById("altar-title").textContent = run.ofrenda.title;
  document.getElementById("altar-remembrance").textContent = run.ofrenda.remembrance;
  document.getElementById("altar-spoken").textContent = run.ofrenda.spoken_line;
  const list = document.getElementById("altar-offerings");
  list.innerHTML = "";
  for (const offering of run.ofrenda.offerings || []) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="kind">${escapeHtml(offering.kind)}</span><span>${escapeHtml(offering.label)}</span>`;
    list.appendChild(li);
  }
  document.getElementById("altar-ground").textContent =
    "Every food, song, and story line above was checked against your notes. Invented details are rejected.";
}

async function loadHistory() {
  const response = await fetch("/api/history");
  const runs = await response.json();
  historyEl.innerHTML = "";
  if (!runs.length) {
    historyEl.innerHTML = "<li>No earlier ofrendas yet.</li>";
    return;
  }
  for (const run of runs.slice(0, 12)) {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.dataset.run = JSON.stringify(run);
    const when = new Date(run.created_at).toLocaleString();
    li.innerHTML = `<strong>${escapeHtml(run.person?.name || "Untitled")}</strong> — ${escapeHtml(when)}`;
    historyEl.appendChild(li);
  }
}

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`.trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function boot() {
  try {
    const health = await fetch("/api/health").then((r) => r.json());
    if (!health.ok) {
      setStatus(health.error || "Ollama is not ready.", "bad");
    } else {
      setStatus(`Ready on ${health.model}. Memories stay on localhost.`);
    }
  } catch {
    setStatus("Server health check failed.", "bad");
  }
  await loadHistory();
}

boot();
