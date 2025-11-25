document.addEventListener("DOMContentLoaded", function() {
  console.log("schedule.js loaded");

  const monthLabel = document.querySelector(".calendar-month");
  const grid = document.querySelector(".calendar-grid");
  const navButtons = Array.from(document.querySelectorAll(".calendar-nav"));
  const prevBtn = navButtons[0];
  const nextBtn = navButtons[1];

  let today = new Date();
  let viewMonth = today.getMonth();
  let viewYear = today.getFullYear();
  let selectedDate = null;

  function clearCalendarKeepHeaders() {
    if (!grid) return;
    // collect headers (first 7 .calendar-day-header)
    const headers = Array.from(grid.querySelectorAll(".calendar-day-header"));
    grid.innerHTML = "";
    headers.forEach(h => grid.appendChild(h));
  }

  function renderCalendar(month, year) {
    if (!grid) return;
    clearCalendarKeepHeaders();
    const first = new Date(year, month, 1);
    const startingDay = first.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();

    for (let i=0;i<startingDay;i++) {
      const div = document.createElement("div");
      div.className = "calendar-day empty";
      grid.appendChild(div);
    }

    for (let d=1; d<=daysInMonth; d++) {
      const div = document.createElement("div");
      div.className = "calendar-day";
      div.textContent = d;
      if (year === today.getFullYear() && month === today.getMonth() && d === today.getDate()) {
        div.classList.add("today");
      }
      div.addEventListener("click", function() {
        const prev = grid.querySelector(".calendar-day.selected");
        if (prev) prev.classList.remove("selected");
        div.classList.add("selected");
        selectedDate = new Date(year, month, d);
        showToast("Selected date: " + selectedDate.toDateString());
      });
      grid.appendChild(div);
    }

    const totalCells = grid.querySelectorAll(".calendar-day, .calendar-day.empty").length;
    const remainder = (7 - (totalCells % 7)) % 7;
    for (let i=0;i<remainder;i++) {
      const div = document.createElement("div");
      div.className = "calendar-day empty";
      grid.appendChild(div);
    }

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    if (monthLabel) monthLabel.textContent = monthNames[month] + " " + year;
  }

  function showToast(msg, timeout=1500) {
    let banner = document.querySelector(".__js_toast");
    if (!banner) {
      banner = document.createElement("div");
      banner.className = "__js_toast";
      Object.assign(banner.style, {
        position: "fixed",
        right: "20px",
        top: "80px",
        background: "#0A6CFF",
        color: "white",
        padding: "10px 14px",
        borderRadius: "8px",
        boxShadow: "0 6px 24px rgba(10,108,255,0.15)",
        zIndex: 9999,
        fontSize: "14px"
      });
      document.body.appendChild(banner);
    }
    banner.textContent = msg;
    banner.style.opacity = "1";
    setTimeout(()=> { banner.style.opacity = "0"; }, timeout);
  }

  document.querySelectorAll(".btn-approve").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      const card = btn.closest(".appointment-card");
      if (!card) return;
      let status = card.querySelector(".status-inline");
      if (!status) {
        status = document.createElement("span");
        status.className = "status-inline";
        status.textContent = "Approved";
        Object.assign(status.style, {marginLeft:"12px", color:"#2E7D32", fontWeight:"600"});
        btn.parentElement.appendChild(status);
      } else {
        status.textContent = "Approved";
      }
      showToast("Appointment approved.");
    });
  });

  document.querySelectorAll(".btn-reschedule").forEach(btn => {
    btn.addEventListener("click", function(e) {
      e.stopPropagation();
      openRescheduleModal(btn.closest(".appointment-card"));
    });
  });

  function openRescheduleModal(card) {
    let modal = document.getElementById("__rs_modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "__rs_modal";
      Object.assign(modal.style, {
        position: "fixed", left:0, top:0, right:0, bottom:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", zIndex: 10000
      });
      const inner = document.createElement("div");
      inner.style.width = "420px";
      inner.style.background = "#fff";
      inner.style.borderRadius = "12px";
      inner.style.padding = "20px";
      inner.style.boxShadow = "0 6px 24px rgba(0,0,0,0.12)";
      inner.innerHTML = `
        <h3 style="margin-bottom:8px;">Reschedule Appointment</h3>
        <p style="color:#666; margin-bottom:12px;">Select a new date from the calendar (or click a date on the right).</p>
        <div id="__rs_info" style="margin-bottom:12px; color:#333;"></div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
          <button id="__rs_cancel" style="padding:8px 12px; border-radius:8px; border:none; background:#F5F5F5;">Cancel</button>
          <button id="__rs_confirm" style="padding:8px 12px; border-radius:8px; border:none; background:#0A6CFF; color:white;">Confirm</button>
        </div>
      `;
      modal.appendChild(inner);
      document.body.appendChild(modal);

      document.getElementById("__rs_cancel").addEventListener("click", closeModal);
      document.getElementById("__rs_confirm").addEventListener("click", function() {
        if (!selectedDate) {
          alert("Please select a date on the calendar first.");
          return;
        }
        if (modal._targetCard) {
          const info = modal._targetCard.querySelector(".appointment-details");
          if (info) {
            const span = document.createElement("span");
            span.className = "detail-item";
            span.textContent = "🔁 " + selectedDate.toDateString();
            info.appendChild(span);
          }
        }
        showToast("Appointment rescheduled to " + selectedDate.toDateString());
        closeModal();
      });
    }
    modal._targetCard = card;
    const patientName = card && (card.querySelector(".patient-info h3") ? card.querySelector(".patient-info h3").textContent : (card.querySelector("h3") ? card.querySelector("h3").textContent : ""));
    const info = modal.querySelector("#__rs_info");
    if (info) info.textContent = "Patient: " + patientName;
    modal.style.display = "flex";
  }

  function closeModal() {
    const modal = document.getElementById("__rs_modal");
    if (modal) modal.style.display = "none";
  }

  if (prevBtn) prevBtn.addEventListener("click", function(){ viewMonth--; if (viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(viewMonth, viewYear); });
  if (nextBtn) nextBtn.addEventListener("click", function(){ viewMonth++; if (viewMonth>11){ viewMonth=0; viewYear++; } renderCalendar(viewMonth, viewYear); });

  renderCalendar(viewMonth, viewYear);
});