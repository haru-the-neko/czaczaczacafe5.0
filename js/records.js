document.addEventListener("DOMContentLoaded", function() {
  console.log("records.js loaded");
  const search = document.querySelector(".search-input");
  const cards = Array.from(document.querySelectorAll(".patient-card"));

  if (search) {
    search.addEventListener("input", function() {
      const q = search.value.trim().toLowerCase();
      cards.forEach(card => {
        const name = card.querySelector(".patient-name-large").textContent.toLowerCase();
        if (name.includes(q)) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  }

  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", function() {
      const card = btn.closest(".patient-card");
      if (!card) return;
      const name = card.querySelector(".patient-name-large").textContent;
      const meta = Array.from(card.querySelectorAll(".meta-item")).map(el => el.textContent).join(" • ");
      openPatientModal(name, meta);
    });
  });

  function openPatientModal(name, meta) {
    let modal = document.getElementById("__patient_modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "__patient_modal";
      Object.assign(modal.style, {position:"fixed", left:0, top:0, right:0, bottom:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000});
      const inner = document.createElement("div");
      inner.style.width = "620px";
      inner.style.background = "#fff";
      inner.style.borderRadius = "12px";
      inner.style.padding = "20px";
      inner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 id="__pm_name" style="margin:0;"></h3>
          <button id="__pm_close" style="border:none; background:#F5F5F5; padding:6px 10px; border-radius:8px; cursor:pointer;">Close</button>
        </div>
        <div id="__pm_meta" style="color:#666; margin-bottom:12px;"></div>
        <div style="padding-top:10px; border-top:1px solid #F5F7FA;">
          <p><strong>Recent Notes (mock)</strong></p>
          <ul>
            <li>Nov 20, 2025 — Follow-up: Blood pressure stable.</li>
            <li>Oct 12, 2025 — Immunization given.</li>
            <li>Sep 01, 2025 — Initial consult.</li>
          </ul>
        </div>
      `;
      modal.appendChild(inner);
      document.body.appendChild(modal);
      document.getElementById("__pm_close").addEventListener("click", function(){ modal.style.display="none"; });
    }
    modal.style.display = "flex";
    document.getElementById("__pm_name").textContent = name;
    document.getElementById("__pm_meta").textContent = meta;
  }
});