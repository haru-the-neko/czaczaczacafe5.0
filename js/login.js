document.addEventListener("DOMContentLoaded", function() {
  console.log("index.js loaded");
  const apptCards = Array.from(document.querySelectorAll(".appointment-card"));
  const statCards = document.querySelectorAll(".stat-card .stat-value");
  const pendingCard = statCards[1];
  const completedCard = statCards[2];

  if (apptCards.length && statCards[0]) {
    statCards[0].textContent = apptCards.length;
  }

  apptCards.forEach(card => {
    card.addEventListener("click", function(e) {
      if (e.target && (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button'))) return;
      const badge = card.querySelector(".status-badge");
      if (!badge) return;
      const current = badge.textContent.trim().toLowerCase();
      if (current === "pending") {
        badge.textContent = "Approved";
        badge.classList.remove("status-pending");
        badge.classList.add("status-approved");
      } else if (current === "approved") {
        badge.textContent = "Completed";
        badge.classList.remove("status-approved");
        badge.classList.add("status-completed");
      } else {
        badge.textContent = "Pending";
        badge.classList.remove("status-completed");
        badge.classList.add("status-pending");
      }
      if (pendingCard) pendingCard.textContent = document.querySelectorAll(".status-pending").length;
      if (completedCard) completedCard.textContent = document.querySelectorAll(".status-completed").length;
    });
  });
});