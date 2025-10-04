let currentStep = 0;
const totalSteps = 5;
let userPreferences = {};

const questions = [
  {
    question: "What is your skin type?",
    type: "single",
    options: ["normal", "dry", "oily", "combination", "sensitive"],
    additional: false,
  },
  {
    question: "Which product categories are you interested in?",
    type: "multiple",
    options: [
      "face wash",
      "cleanser",
      "toner",
      "exfoliator",
      "essence",
      "serum",
      "ampoule",
      "moisturizer",
      "eye cream",
      "sunscreen",
      "spot treatment",
      "mask",
      "sheet mask",
      "face oil",
      "lip care",
    ],
    additional: true,
  },
  {
    question: "What benefits are you looking for?",
    type: "multiple",
    options: [
      "Hydrating",
      "Brightening",
      "Anti-aging",
      "Soothing",
      "Exfoliating",
      "Clarifying",
      "Barrier Repair",
      "Acne",
      "Blemish Control",
      "Oil",
      "Sebum Control",
      "Hyperpigmentation",
      "Even Skin Tone",
      "Firming",
      "Elasticity",
      "Redness Reduction",
      "Pore Care",
      "Radiance",
      "Glow",
    ],
    additional: true,
  },
  {
    question: "Which ingredients do you prefer or want to include?",
    type: "multiple",
    options: [
      "Water",
      "Glycerin",
      "Hyaluronic Acid",
      "Salicylic Acid",
      "Niacinamide",
      "Vitamin C",
      "Retinol",
      "Peptides",
      "Ceramides",
      "Panthenol",
      "Allantoin",
      "Centella Asiatica",
      "Madecassoside",
      "Azelaic Acid",
      "Alpha Arbutin",
      "Tranexamic Acid",
      "Kojic Acid",
      "Licorice Extract",
      "Squalane",
      "Zinc PCA",
      "Tea Tree Oil",
      "Witch Hazel",
      "Aloe Vera",
      "Green Tea",
      "Jojoba Oil",
      "Shea Butter",
      "Coconut Oil",
      "Snail Mucin",
      "Galactomyces",
      "Betaine",
      "Lactic Acid",
      "Glycolic Acid",
      "Gluconolactone",
      "Ferulic Acid",
      "Resveratrol",
      "Vitamin E",
      "Fragrance",
      "Alcohol",
      "Parabens",
    ],
    additional: true,
  },
  {
    question: "Any additional skincare keywords or concerns you'd like to add?",
    type: "text",
  },
];

function updateProgressBar() {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  const bar = document.querySelector(".progress-bar");
  const counter = document.getElementById("stepCounter");
  if (bar) bar.style.width = `${progressPercentage}%`;
  if (counter) counter.textContent = `${currentStep + 1} of ${totalSteps}`;
}

function focusTitle(offset = 140) {
  const title = document.getElementById("quizTitle");
  if (!title) return;
  const y = title.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: y, behavior: "smooth" });
}

function renderQuestion() {
  focusTitle();
  const question = questions[currentStep];
  const container = document.getElementById("questionContainer");
  if (!container) return;
  if (question.type == "text") {
    container.innerHTML = `
    <div class="fade-in">
      <h3 class="text-2xl font-bold text-gray-800 mb-6">${question.question}</h3>
      <div class="space-y-3">
        <div class="text-gray-500 text-base mb-2">Example: Safe for pregnant women</div>
        <label>
          <input type="${question.type}" name="question${currentStep}" class="mr-3 text-orange-500 focus:ring-orange-500 flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition focus:outline-none w-full">
        </label>
      </div>
    </div>`;
  } else {
    container.innerHTML = `
    <div class="fade-in">
      <h3 class="text-2xl font-bold text-gray-800 mb-6">${
        question.question
      }</h3>
      <div class="space-y-3">
        ${question.options
          .map(
            (option) => `
          <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition">
            <input type="${
              question.type === "single" ? "radio" : "checkbox"
            }" name="question${currentStep}" value="${option}" class="mr-3 text-orange-500 focus:ring-orange-500">
            <span class="text-gray-700">${option}</span>
          </label>`
          )
          .join("")}
      </div>
      <div class="mt-3 space-y-3">
        ${
          question.additional
            ? `<span class="text-gray-500 text-base">Other:</span>
            <input type="text" name="question${currentStep}_additional" placeholder="Other (please specify)" class="mr-3 text-orange-500 focus:ring-orange-500 flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition focus:outline-none w-full">`
            : ""
        }
      </div>
    </div>`;
  }

  // Visual toggles
  container.querySelectorAll("label").forEach((label) => {
    label.addEventListener("click", () => {
      if (question.type === "single") {
        container
          .querySelectorAll("label")
          .forEach((l) =>
            l.classList.remove("border-orange-500", "bg-orange-50")
          );
        label.classList.add("border-orange-500", "bg-orange-50");
      } else {
        label.classList.toggle("border-orange-500");
        label.classList.toggle("bg-orange-50");
      }
    });
  });
}

function collectAndNext() {
  // console.log("userPreferences", userPreferences);
  const question = questions[currentStep];
  if (question.type == "text") {
    const input = document.querySelector(
      `input[name="question${currentStep}"]`
    );
    if (input && input.value.trim() !== "") {
      userPreferences[`q${currentStep}`] = input.value.trim();
    } else {
      userPreferences[`q${currentStep}`] = "";
    }
  } else {
    const inputs = document.querySelectorAll(
      `input[name="question${currentStep}"]:checked`
    );

    if (inputs.length === 0) {
      alert("Please select an answer before continuing.");
      return;
    }

    if (questions[currentStep].type === "single") {
      userPreferences[`q${currentStep}`] = inputs[0].value;
    } else {
      userPreferences[`q${currentStep}`] = Array.from(inputs).map(
        (i) => i.value
      );
    }

    if (question.additional) {
      const otherInput = document.querySelector(
        `input[name="question${currentStep}_additional"]`
      );
      if (otherInput && otherInput.value.trim() !== "") {
        userPreferences[`q${currentStep}`].push(otherInput.value.trim());
      }
    }
  }

  if (currentStep < totalSteps - 1) {
    currentStep++;
    updateProgressBar();
    renderQuestion();
  } else {
    sessionStorage.setItem("userPreferences", JSON.stringify(userPreferences));
    // sendQuiz();
    window.location.href = "/loading";
  }
}

async function sendQuiz() {
  // 1) Ambil data dari storage
  const safeParse = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const prefs = safeParse(sessionStorage.getItem("userPreferences"));
  const user = safeParse(localStorage.getItem("currentUser"));

  if (!prefs) {
    alert("Preferences not found. Please retake the quiz.");
    window.location.href = "/quiz";
    return;
  }

  // 2) Bentuk payload untuk proses rekomendasi di server
  const join = (v) => (Array.isArray(v) ? v.join(" ") : v || "");
  const mergedPreferences = Object.keys(prefs)
    .map((k) => join(prefs[k]))
    .filter(Boolean)
    .join(" ");

  const payload = {
    id_user: user ? user.id_user : "guest",
    preferences: mergedPreferences,
  };

  // 3) Kirim ke server untuk diproses
  try {
    const res = await fetch("/quiz_process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ payload }),
    });

    const data = await res.json();
    if (data?.items) {
      sessionStorage.setItem(
        "item_recommendations",
        JSON.stringify(data.items)
      );
    }
  } catch (e) {
    console.error("Send Quiz failed:", e);
  }

  // 4) Redirect ke result
  window.location.href = "/result";
}

function goPrev() {
  if (currentStep === 0) return;
  currentStep--;
  updateProgressBar();
  renderQuestion();
}

function mountQuizPage() {
  displayUserName();
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  if (!nextBtn || !prevBtn) return;

  if (sessionStorage.getItem("item_recommendations")) {
    window.location.href = "/result";
    return;
  }

  currentStep = 0;
  userPreferences = {};
  updateProgressBar();
  renderQuestion();
  nextBtn.addEventListener("click", collectAndNext);
  prevBtn.addEventListener("click", goPrev);
}

function mountResultPage() {
  const item_recommendations =
    JSON.parse(sessionStorage.getItem("item_recommendations")) || [];

  if (!item_recommendations) return;

  // Daftar item yang direkomendasikan
  let id_items = [];
  let list_recommendations = [];
  item_recommendations.map((r) => {
    products.map((p) => {
      if (Number(r.id_item) === Number(p.id_item)) {
        id_items.push(p.id_item);
        list_recommendations.push(p);
      }
    });
  });

  // Daftar item yang tidak direkomendasikan
  let list_not_recommendations = products.filter(
    (p) => !id_items.includes(p.id_item)
  );

  // const spinner = document.getElementById("loadingSpinner");
  // const results = document.getElementById("recommendationResults");
  const container = document.getElementById("itemContainer");
  // if (!spinner || !results || !container) return;
  // spinner.classList.add("hidden");
  // results.classList.remove("hidden");

  // Simulate processing
  setTimeout(() => {
    container.innerHTML = `
      <div class="space-y-8">
        <div class="bg-white rounded-2xl p-8 shadow-lg">
          <div class="grid gap-3 lg:grid-cols-[1fr_150px] mb-6 items-center">
            <h3 class="text-2xl font-bold text-gray-800 capitalize">product list</h3>
            <div>
              <label for="topN" class="block text-sm font-medium text-gray-700 mb-1">
                Show Top-N
              </label>
              <select id="topN"
                class="w-full rounded-lg border border-gray-300 px-3 py-2
                      focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-500">
                <option value="5" selected>Top 5</option>
                <option value="10">Top 10</option>
                <option value="15">Top 15</option>
                <option value="20">Top 20</option>
                <option value="25">Top 25</option>
                <option value="30">Top 30</option>
                <option value="all">Show All</option>
              </select>
            </div>
          </div>
          <div class="grid gap-6">
          ${list_recommendations
            .map(
              (p, idx) => `
            <div class="overflow-hidden flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer" onclick="showProductDetail('${
              p.id_item
            }')">
              <img src="${p.image || ""}" alt="${
                p.title
              }" class="w-16 h-16 rounded-lg object-cover mr-4">
              <div class="flex-1">
                <h4 class="text-base font-semibold text-gray-900 leading-tight tracking-tight line-clamp-2">${
                  p.title
                } <span class="text-gray-500 font-medium">– ${p.brand}</span>
                </h4>
                <span class="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">${
                  p.skin_type
                }</span>
                <p class="mt-2 text-sm text-gray-600 line-clamp-2">${
                  (p.descriptions || "").split("\n")[0]
                }</p>
              </div>
              <div class="md:ml-5 text-right">
                <p class="font-bold text-orange-600">${p.price || ""}</p>
              </div>
            </div>`
            )
            .join("")}
          </div>
        </div>
      </div>`;
    applyTopN(container, list_recommendations);
  }, 200);
}

// bikin function untuk nampilin nama user di quiz page
function displayUserName() {
  const welcomeMessageDiv = document.getElementById("welcomeMessage");
  const localName = JSON.parse(localStorage.getItem("currentUser"));

  if (welcomeMessageDiv && localName) {
    welcomeMessageDiv.innerHTML = `
    <p class="text-2xl font-semibold text-gray-800">
      Halo <span id="userName" class="text-orange-600">${localName.username}</span>!
    </p>
    `;
  } else if (welcomeMessageDiv) {
    welcomeMessageDiv.innerHTML = ``;
  }
}

// Event listener untuk retake quiz
const retakeBtn = document.getElementById("retakeBtn");
if (retakeBtn) {
  retakeBtn.addEventListener("click", () => {
    clearQuizData();
    window.location.href = "/quiz";
  });
}

function clearQuizData() {
  currentStep = 0;
  userPreferences = {};
  sessionStorage.removeItem("userPreferences");
  sessionStorage.removeItem("item_recommendations");
  setTimeout(() => (window.location.href = "/homepage"), 1000);
}

function applyTopN(containerEl, items) {
  const topNEl = document.getElementById("topN");
  const listEl = containerEl.querySelector(".grid.gap-6");
  if (!topNEl || !listEl || !Array.isArray(items)) return;

  function render() {
    const val = topNEl.value;
    const n = val === "all" ? items.length : parseInt(val, 10) || 0;

    listEl.innerHTML = items
      .slice(0, n)
      .map(
        (p) => `
      <div class="overflow-hidden flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer" onclick="showProductDetail('${
        p.id_item
      }')">
        <img src="${p.image || ""}" alt="${
          p.title
        }" class="w-16 h-16 rounded-lg object-cover mr-4">
        <div class="flex-1">
          <h4 class="text-base font-semibold text-gray-900 leading-tight tracking-tight line-clamp-2">
            ${p.title} 
          <span class="text-gray-500 font-medium">– ${p.brand}</span>
          </h4>
          <span class="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
            ${p.skin_type}
          </span>
          <p class="mt-2 text-sm text-gray-600 line-clamp-2">
            ${(p.descriptions || "").split("\n")[0]}
          </p>
        </div>
        <div class="md:ml-5 text-right">
          <p class="font-bold text-orange-600">${p.price || ""}</p>
        </div>
      </div>
    `
      )
      .join("");
  }

  topNEl.addEventListener("change", render);
  render();
}

// jika  sekarang di halaman loading maka arahkan ke quiz() dan sudah ada session storage userPreferences
if (
  document.getElementById("loadingSpinner") &&
  sessionStorage.getItem("userPreferences")
) {
  setTimeout(() => {
    sendQuiz();
  }, 5000);
}
