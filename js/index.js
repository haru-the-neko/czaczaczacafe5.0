document.addEventListener("DOMContentLoaded", function() {
  const form = document.querySelector("form");
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  if (!form) return;

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    const em = email && email.value.trim();
    const pw = password && password.value.trim();

    if (!em || !pw) {
      alert("Please enter email and password.");
      return;
    }

    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Logging in...";
    }

    setTimeout(function() {
      window.location.href = "login.html";
    }, 700);
  });
});