let currentUser = null;

function restoreUserFromStorage() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) currentUser = JSON.parse(raw);
  } catch {}
}

function persistUser() {
  if (currentUser) {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  } else {
    localStorage.removeItem("currentUser");
  }
}

function openLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    document.body.classList.add("modal-open");
    modal.classList.remove("hidden");
  }
}

function closeLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    document.body.classList.remove("modal-open");
    modal.classList.add("hidden");
  }
}

function attachAuthHandlers() {
  const btn = document.getElementById("loginBtn");
  const form = document.getElementById("loginForm");
  const closeBtn = document.getElementById("closeLogin");

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

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameEl = document.getElementById("username");
      const passwordEl = document.getElementById("password");
      const username = usernameEl.value.trim();
      const password = passwordEl.value.trim();
      if (!username || !password) return;

      try {
        const data = await fetch("./static/data/accounts2.json", {
          cache: "no-store",
        });
        const accounts = await data.json();
        const user = accounts.find(
          (acc) => acc.username === username && acc.password === password
        );
        if (!user) {
          alert("Invalid username or password.");
          return;
        }

        const { id_user } = user;
        currentUser = {
          id_user,
          username,
          loginTime: new Date().toISOString(),
        };
        persistUser();
        closeLoginModal();
        attachAuthHandlers();
        alert(
          "Login successful! You can now get personalized recommendations."
        );
        clearQuizData();
      } catch (err) {
        console.error("Login error:", err);
        alert("Error login, check console for details.");
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeLoginModal);
}

function logout() {
  currentUser = null;
  persistUser();
  const btn = document.getElementById("loginBtn");
  if (btn) {
    btn.textContent = "Login";
    btn.onclick = () => openLoginModal();
  }
}

function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return alert(msg);
  el.textContent = msg;
  el.classList.remove("hidden", "opacity-0");
  setTimeout(() => el.classList.add("opacity-0"), 1800);
  setTimeout(() => el.classList.add("hidden"), 2200);
  clearQuizData();  
}
