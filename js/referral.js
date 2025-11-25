/* js/referral.js
   Integrates:
   - patient auto-fill (from localStorage or demo list)
   - referral ID generation (REF-YYYY-MM-DD-###)
   - validation visual highlighting
   - confirmation modal before submit
   - saving referrals to localStorage with status tracking
   - attach files (metadata only)
   - print preview (window.print)
   - Cancel: go back if history available, otherwise clear form
*/

document.addEventListener("DOMContentLoaded", function () {
  console.log("referral.js loaded (enhanced)");

  // --- storage keys
  const PATIENTS_KEY = "konsutal_patients_v1";         // optional patient registry
  const REFERRALS_KEY = "konsutal_referrals_v1";       // saved referrals
  const FILE_META_KEY = "konsutal_ref_files_v1";       // store file metadata only (not file content)

  // --- DOM
  const form = document.getElementById("referral-form");
  const patientSelect = document.getElementById("patient-select");
  const patientName = document.getElementById("patient-name");
  const patientAge = document.getElementById("patient-age");
  const patientSex = document.getElementById("patient-sex");
  const referralDate = document.getElementById("referral-date");
  const receivingFacility = document.getElementById("receiving-facility");
  const reasonReferral = document.getElementById("reason-referral");
  const initialFindings = document.getElementById("initial-findings");
  const referralIdInput = document.getElementById("referral-id");
  const supportingFiles = document.getElementById("supporting-files");
  const attachedList = document.getElementById("attached-list");
  const referralsList = document.getElementById("referrals-list");
  const btnCancel = document.getElementById("btn-cancel");
  const btnPreview = document.getElementById("btn-preview");

  if (!form) return;

  // --- demo patients fallback (will be saved to localStorage if not present)
  const demoPatients = [
    { id: "p1", name: "Latrel Angelo", age: "42", sex: "male" },
    { id: "p2", name: "Steph Landicho", age: "35", sex: "female" },
    { id: "p3", name: "Jay Albufera", age: "28", sex: "male" }
  ];

  // --- helpers for storage
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
  }

  // --- init patients (if none stored, seed with demo)
  function initPatients() {
    let patients = readJSON(PATIENTS_KEY, null);
    if (!patients || !Array.isArray(patients) || patients.length === 0) {
      patients = demoPatients;
      writeJSON(PATIENTS_KEY, patients);
    }
    return patients;
  }

  // Populate patient selector and bind auto-fill
  let patients = initPatients();
  function populatePatientSelect(list) {
    patientSelect.innerHTML = `<option value="">-- select patient or type to search --</option>`;
    list.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} — ${p.age || "—"} yrs`;
      opt.dataset.name = p.name;
      opt.dataset.age = p.age || "";
      opt.dataset.sex = p.sex || "";
      patientSelect.appendChild(opt);
    });
  }
  populatePatientSelect(patients);

  // When patient selected -> auto fill
  patientSelect.addEventListener("change", function () {
    const id = patientSelect.value;
    if (!id) {
      // clear only if user cleared selection
      patientName.value = "";
      patientAge.value = "";
      patientSex.value = "";
      return;
    }
    const p = patients.find(x => x.id === id);
    if (p) {
      patientName.value = p.name || "";
      patientAge.value = p.age || "";
      patientSex.value = p.sex || "";
      generateReferralId(); // regenerate ID when patient selected
    }
  });

  // --- referral id generator REF-YYYY-MM-DD-### (increment based on existing count for the day)
  function generateReferralId() {
    const date = new Date(referralDate.value || new Date().toISOString().slice(0, 10));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const base = `REF-${y}-${m}-${d}`;
    // count existing referrals with same date prefix
    const referrals = readJSON(REFERRALS_KEY, []);
    const sameDay = referrals.filter(r => r.id && r.id.startsWith(base)).length + 1;
    const seq = String(sameDay).padStart(3, "0");
    const id = `${base}-${seq}`;
    referralIdInput.value = id;
    return id;
  }

  // set default date to today (if empty) and generate id
  if (!referralDate.value) referralDate.value = new Date().toISOString().slice(0, 10);
  generateReferralId();
  referralDate.addEventListener("change", generateReferralId);

  // --- validation utils
  function markInvalid(el) {
    el.classList.add("invalid");
  }
  function clearInvalid(el) {
    el.classList.remove("invalid");
  }
  function validateForm() {
    const requiredEls = [patientName, patientAge, patientSex, referralDate, receivingFacility, reasonReferral, initialFindings];
    let ok = true;
    requiredEls.forEach(el => {
      clearInvalid(el);
      const val = (el.value || "").toString().trim();
      if (!val) {
        markInvalid(el);
        ok = false;
      }
    });
    return ok;
  }

  // --- attachments handling (we store file metadata only)
  function renderAttachedMeta(files) {
    if (!files || files.length === 0) {
      attachedList.innerHTML = "<div class='small-muted'>No attachments</div>";
      return;
    }
    attachedList.innerHTML = "";
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "12px";
      row.style.padding = "8px 0";
      row.innerHTML = `<div>${f.name} <small style="color:#888">(${Math.round(f.size/1024)} KB)</small></div><div><button type="button" data-idx="${i}" class="btn btn-cancel attach-remove">Remove</button></div>`;
      attachedList.appendChild(row);
    }
  }

  // store metadata in localStorage (filename + timestamp)
  function storeFileMeta(refId, files) {
    const meta = readJSON(FILE_META_KEY, {});
    meta[refId] = meta[refId] || [];
    for (let i = 0; i < files.length; i++) {
      meta[refId].push({ name: files[i].name, size: files[i].size, ts: Date.now() });
    }
    writeJSON(FILE_META_KEY, meta);
  }

  supportingFiles.addEventListener("change", function (e) {
    renderAttachedMeta(Array.from(supportingFiles.files));
  });

  // allow removing attachments in UI (does not modify file input content — you can re-select)
  attachedList.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("attach-remove")) {
      const idx = parseInt(e.target.dataset.idx, 10);
      // we can't edit input.files directly; simplest is to clear input and remove the file from displayed list
      const fList = Array.from(supportingFiles.files);
      fList.splice(idx, 1);
      // create a new DataTransfer to reset input.files (works in most browsers)
      try {
        const dt = new DataTransfer();
        fList.forEach(f => dt.items.add(f));
        supportingFiles.files = dt.files;
        renderAttachedMeta(fList);
      } catch (err) {
        // fallback: clear everything
        supportingFiles.value = "";
        renderAttachedMeta([]);
      }
    }
  });

  // --- referrals listing & status management
  function loadReferrals() {
    return readJSON(REFERRALS_KEY, []);
  }
  function saveReferrals(list) {
    writeJSON(REFERRALS_KEY, list);
  }
  function renderReferralsBox() {
    const list = loadReferrals();
    if (!list.length) {
      referralsList.innerHTML = "<div class='small-muted'>No referrals created yet.</div>";
      return;
    }
    referralsList.innerHTML = "";
    // list most recent first
    list.slice().reverse().forEach(r => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.padding = "8px 0";
      item.style.borderBottom = "1px solid #F5F7FA";
      item.innerHTML = `
        <div>
          <div style="font-weight:700">${r.id} — ${r.patientName}</div>
          <div style="font-size:13px; color:#666">${r.receivingFacility} • ${new Date(r.ts).toLocaleString()}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <div style="padding:6px 8px; border-radius:6px; background:${statusColor(r.status)}; color:#fff; font-size:13px; font-weight:600;">${r.status}</div>
          <button class="btn btn-cancel btn-view-ref" data-id="${r.id}">View</button>
          <button class="btn btn-cancel btn-del-ref" data-id="${r.id}">Delete</button>
        </div>
      `;
      referralsList.appendChild(item);
    });
  }

  function statusColor(status) {
    switch ((status || "").toLowerCase()) {
      case "pending": return "#F0A500"; // amber
      case "accepted": return "#2E7D32";
      case "scheduled": return "#0A6CFF";
      case "rejected": return "#C62828";
      default: return "#666";
    }
  }

  // view referral detail (modal), and allow changing status
  referralsList.addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("btn-view-ref")) {
      const id = e.target.dataset.id;
      openReferralViewModal(id);
    }
    if (e.target && e.target.classList.contains("btn-del-ref")) {
      const id = e.target.dataset.id;
      if (!confirm("Delete this referral? This cannot be undone.")) return;
      let list = loadReferrals();
      list = list.filter(r => r.id !== id);
      saveReferrals(list);
      renderReferralsBox();
      alert("Referral deleted.");
    }
  });

  function openReferralViewModal(id) {
    const list = loadReferrals();
    const r = list.find(x => x.id === id);
    if (!r) return alert("Referral not found");
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal">
        <h3>Referral ${r.id}</h3>
        <div style="margin-bottom:6px;"><strong>Patient:</strong> ${escapeHtml(r.patientName)} (${escapeHtml(r.patientAge)} yrs, ${escapeHtml(r.patientSex)})</div>
        <div style="margin-bottom:6px;"><strong>Facility:</strong> ${escapeHtml(r.receivingFacility)}</div>
        <div style="margin-bottom:6px;"><strong>Reason:</strong> ${escapeHtml(r.reason)}</div>
        <div style="margin-bottom:6px;"><strong>Findings:</strong> ${escapeHtml(r.findings)}</div>
        <div style="margin-top:8px;"><strong>Status:</strong>
          <select id="__status_select">
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div class="buttons">
          <button id="__close_btn" class="btn btn-cancel">Close</button>
          <button id="__print_ref" class="btn btn-primary">Print</button>
          <button id="__save_status" class="btn btn-primary">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // set current status
    const sel = modal.querySelector("#__status_select");
    sel.value = r.status || "Pending";
    modal.querySelector("#__close_btn").addEventListener("click", () => modal.remove());
    modal.querySelector("#__print_ref").addEventListener("click", () => {
      // Use a print window for the selected referral
      openPrintWindowForReferral(r);
    });
    modal.querySelector("#__save_status").addEventListener("click", () => {
      const newStatus = sel.value;
      const all = loadReferrals();
      const idx = all.findIndex(x => x.id === r.id);
      if (idx >= 0) {
        all[idx].status = newStatus;
        saveReferrals(all);
        renderReferralsBox();
        alert("Status updated");
        modal.remove();
      }
    });
  }

  // print helper
  function openPrintWindowForReferral(r) {
    const w = window.open("", "_blank", "noopener");
    if (!w) return alert("Popup blocked. Allow popups and try again.");
    const html = `
      <html><head><title>Referral ${r.id}</title>
        <style>
          body{ font-family: Arial, Helvetica, sans-serif; padding:24px; color:#111; }
          h1{ font-size:20px; }
          .section{ margin-bottom:12px; }
          .klabel{ font-weight:700; }
        </style>
      </head>
      <body>
        <h1>KonsultaLokál Referral</h1>
        <div class="section"><div class="klabel">Referral ID:</div><div>${r.id}</div></div>
        <div class="section"><div class="klabel">Patient:</div><div>${escapeHtml(r.patientName)} — ${escapeHtml(r.patientAge)} yrs</div></div>
        <div class="section"><div class="klabel">Sex:</div><div>${escapeHtml(r.patientSex)}</div></div>
        <div class="section"><div class="klabel">Facility:</div><div>${escapeHtml(r.receivingFacility)}</div></div>
        <div class="section"><div class="klabel">Reason:</div><div>${escapeHtml(r.reason)}</div></div>
        <div class="section"><div class="klabel">Findings:</div><div>${escapeHtml(r.findings)}</div></div>
        <div class="section"><div class="klabel">Status:</div><div>${r.status}</div></div>
        <div style="margin-top:20px;"><button onclick="window.print();">Print / Save as PDF</button></div>
      </body></html>
    `;
    w.document.write(html);
    w.document.close();
  }

  // escape helper
  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // --- preview modal (renders referral preview)
  function openPreviewModal(payload) {
    const preview = document.getElementById("preview-modal");
    preview.innerHTML = "";
    preview.style.display = "block";
    const wrapper = document.createElement("div");
    wrapper.className = "modal-backdrop";
    wrapper.innerHTML = `
      <div class="modal">
        <h3>Referral Preview — ${payload.id}</h3>
        <div><strong>Patient:</strong> ${escapeHtml(payload.patientName)} (${escapeHtml(payload.patientAge)} yrs, ${escapeHtml(payload.patientSex)})</div>
        <div><strong>Referral Date:</strong> ${new Date(payload.date).toLocaleString()}</div>
        <div style="margin-top:8px;"><strong>Receiving Facility:</strong> ${escapeHtml(payload.receivingFacility)}</div>
        <div style="margin-top:8px;"><strong>Reason:</strong><p>${escapeHtml(payload.reason)}</p></div>
        <div style="margin-top:8px;"><strong>Findings:</strong><p>${escapeHtml(payload.findings)}</p></div>
        <div style="margin-top:8px;"><strong>Attachments:</strong><div id="__preview_attach">${payload.attachNames.length ? payload.attachNames.join(", ") : "None"}</div></div>
        <div class="buttons">
          <button id="__preview_close" class="btn btn-cancel">Close</button>
          <button id="__preview_confirm" class="btn btn-primary">Confirm & Submit</button>
          <button id="__preview_print" class="btn btn-primary">Print (Preview)</button>
        </div>
      </div>
    `;
    preview.appendChild(wrapper);

    wrapper.querySelector("#__preview_close").addEventListener("click", () => preview.style.display = "none");
    wrapper.querySelector("#__preview_print").addEventListener("click", () => openPrintWindowForReferral(payload));
    wrapper.querySelector("#__preview_confirm").addEventListener("click", function () {
      preview.style.display = "none";
      submitReferral(payload, { fromPreview: true });
    });
  }

  // confirmation modal (further safety) kept simple
  function openConfirmModal(message, onConfirm) {
    const confirmEl = document.getElementById("confirm-modal");
    confirmEl.innerHTML = "";
    confirmEl.style.display = "block";
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop";
    wrap.innerHTML = `
      <div class="modal">
        <h3>Confirm</h3>
        <div>${escapeHtml(message)}</div>
        <div class="buttons">
          <button id="__c_no" class="btn btn-cancel">Cancel</button>
          <button id="__c_yes" class="btn btn-primary">Yes, continue</button>
        </div>
      </div>
    `;
    confirmEl.appendChild(wrap);
    wrap.querySelector("#__c_no").addEventListener("click", () => confirmEl.style.display = "none");
    wrap.querySelector("#__c_yes").addEventListener("click", () => { confirmEl.style.display = "none"; onConfirm && onConfirm(); });
  }

  // final submission that saves referral to storage and optionally stores file metadata
  function submitReferral(payload, opts = {}) {
    // finalize payload fields
    payload.ts = Date.now();
    payload.status = payload.status || "Pending";
    const list = loadReferrals();
    list.push(payload);
    saveReferrals(list);
    // store file metadata
    if (payload.attachFiles && payload.attachFiles.length) {
      storeFileMeta(payload.id, payload.attachFiles);
    }
    // UI updates
    renderReferralsBox();
    alert("Referral created: " + payload.id);
    // clear the form (keep patient selection)
    if (!opts.keepForm) {
      form.reset();
      supportingFiles.value = "";
      renderAttachedMeta([]);
      // regenerate referral id for next submission
      setTimeout(generateReferralId, 80);
    }
  }

  // Build payload from form
  function buildPayloadFromForm() {
    const id = referralIdInput.value || generateReferralId();
    const payload = {
      id,
      patientName: patientName.value.trim(),
      patientAge: patientAge.value.trim(),
      patientSex: patientSex.value.trim(),
      date: referralDate.value,
      receivingFacility: receivingFacility.value,
      reason: reasonReferral.value.trim(),
      findings: initialFindings.value.trim(),
      attachNames: Array.from(supportingFiles.files || []).map(f => f.name),
      attachFiles: Array.from(supportingFiles.files || []), // actual File objects for metadata storage
      ts: Date.now(),
      status: "Pending"
    };
    return payload;
  }

  // handle Preview button (shows preview modal)
  btnPreview.addEventListener("click", function () {
    // validation before preview, but do not mark visually until user submits
    if (!validateForm()) {
      alert("Please fill required fields (highlighted).");
      return;
    }
    const payload = buildPayloadFromForm();
    openPreviewModal(payload);
  });

  // form submit -> show confirmation modal then save
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fill required fields (highlighted).");
      return;
    }
    const payload = buildPayloadFromForm();
    openConfirmModal("Are you sure you want to submit this referral? You can print or change status later.", function () {
      submitReferral(payload);
    });
  });

  // Cancel: go back in history if possible; otherwise clear the form
  btnCancel.addEventListener("click", function () {
    if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      if (confirm("Clear the form?")) {
        form.reset();
        supportingFiles.value = "";
        renderAttachedMeta([]);
        generateReferralId();
      }
    }
  });

  // helper to open a print preview of the current form
  function openPrintWindowForReferral(formData) {
    // Build same style print window
    const html = `
      <html><head><title>Referral ${formData.id}</title>
        <style>
          body{ font-family: Arial, Helvetica, sans-serif; padding:20px; }
          h1{ margin-bottom:8px; }
          .row{ margin-bottom:10px; }
          .label{ font-weight:700; width:160px; display:inline-block; }
        </style>
      </head><body>
        <h1>KonsultaLokál Referral</h1>
        <div class="row"><span class="label">Referral ID:</span>${formData.id}</div>
        <div class="row"><span class="label">Patient:</span>${escapeHtml(formData.patientName)} (${escapeHtml(formData.patientAge)} yrs)</div>
        <div class="row"><span class="label">Sex:</span>${escapeHtml(formData.patientSex)}</div>
        <div class="row"><span class="label">Date:</span>${new Date(formData.date).toLocaleDateString()}</div>
        <div class="row"><span class="label">Facility:</span>${escapeHtml(formData.receivingFacility)}</div>
        <div class="row"><span class="label">Reason:</span>${escapeHtml(formData.reason)}</div>
        <div class="row"><span class="label">Findings:</span>${escapeHtml(formData.findings)}</div>
        <div style="margin-top:20px;"><button onclick="window.print()">Print / Save as PDF</button></div>
      </body></html>
    `;
    const w = window.open("", "_blank", "noopener");
    if (!w) return alert("Popup blocked — allow popups to print.");
    w.document.write(html);
    w.document.close();
  }

  // --- initial UI render
  renderAttachedMeta([]);
  renderReferralsBox();

  // track patients dynamic update (if patient data is changed elsewhere it can be reloaded)
  window.addEventListener("storage", function (e) {
    if (e.key === PATIENTS_KEY) {
      patients = readJSON(PATIENTS_KEY, demoPatients);
      populatePatientSelect(patients);
    }
  });

});
