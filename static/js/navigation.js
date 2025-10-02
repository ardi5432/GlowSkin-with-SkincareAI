async function loadPartial(rootId, file) {
  const root = document.getElementById(rootId);
  if (!root) return;
  try {
    const res = await fetch(file, { cache: "no-cache" });
    root.innerHTML = await res.text();
  } catch (e) {
    root.innerHTML =
      '<div class="p-4 bg-red-50 text-red-700">Failed to load partial: ' +
      file +
      "</div>";
  }
}

// Highlight active nav link
function highlightActiveNav() {
  const path = location.pathname.split("/").pop() || "homepage.html";
  document.querySelectorAll(".nav-link").forEach((a) => {
    const isActive = a.getAttribute("href") === path;
    a.classList.toggle("text-orange-600", isActive);
    a.classList.toggle("font-semibold", isActive);
  });
}

async function mountPartials() {
  await Promise.all([
    loadPartial("navbarRoot", "partials/navbar"),
    loadPartial("footerRoot", "partials/footer"),
    loadPartial("loginModalRoot", "partials/login-modal"),
  ]);
  // After partials injected, attach logic that depends on them
  restoreUserFromStorage();
  attachAuthHandlers();
  highlightActiveNav();
}

function mountPageSpecific() {
  mountProductsGrid();
  mountQuizPage();
  mountResultPage();
}

(function () {
  // Toggle open/close menu (berfungsi walau elemen dimuat belakangan)
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("#menuToggle");
    const menu = document.getElementById("mobileMenu");
    if (toggle && menu) {
      const hidden = menu.classList.toggle("hidden");
      toggle.setAttribute("aria-expanded", String(!hidden));
      const bars = toggle.querySelectorAll("span");
      if (!hidden) {
        // animasi jadi "X"
        if (bars[0]) bars[0].style.transform = "translateY(6px) rotate(45deg)";
        if (bars[1]) bars[1].style.opacity = "0";
        if (bars[2])
          bars[2].style.transform = "translateY(-6px) rotate(-45deg)";
      } else {
        if (bars[0]) bars[0].style.transform = "";
        if (bars[1]) bars[1].style.opacity = "1";
        if (bars[2]) bars[2].style.transform = "";
      }

      const btn = document.getElementById("loginBtn2");
      if (btn) {
        if (currentUser?.username) {
          btn.textContent = `Welcome, ${currentUser.username}`;
          btn.onclick = () => {
            const ok = confirm(`Logout ${currentUser.username}?`);
            if (ok) {
              logout();
              showToast("You have been logged out.");
            }
          };
        } else {
          btn.textContent = "Login";
          btn.onclick = () => openLoginModal();
        }
      }

      return; // jangan terus ke handler close-outside
    }

    // Close on outside click
    const menuEl = document.getElementById("mobileMenu");
    const toggleEl = document.getElementById("menuToggle");
    if (menuEl && toggleEl && !menuEl.classList.contains("hidden")) {
      if (!menuEl.contains(e.target) && !toggleEl.contains(e.target)) {
        menuEl.classList.add("hidden");
        toggleEl.setAttribute("aria-expanded", "false");
        const bars = toggleEl.querySelectorAll("span");
        if (bars[0]) bars[0].style.transform = "";
        if (bars[1]) bars[1].style.opacity = "1";
        if (bars[2]) bars[2].style.transform = "";
      }
    }
  });

  // Auto-close saat resize ke md+
  window.addEventListener("resize", () => {
    const menu = document.getElementById("mobileMenu");
    const toggle = document.getElementById("menuToggle");
    if (
      menu &&
      toggle &&
      window.innerWidth >= 768 &&
      !menu.classList.contains("hidden")
    ) {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
      const bars = toggle.querySelectorAll("span");
      if (bars[0]) bars[0].style.transform = "";
      if (bars[1]) bars[1].style.opacity = "1";
      if (bars[2]) bars[2].style.transform = "";
    }
  });
})();
