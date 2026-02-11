const dishEl = document.getElementById("dish");
const tagsEl = document.getElementById("tags");
const spinBtn = document.getElementById("spin");
const saveBtn = document.getElementById("save");
const rerollBtn = document.getElementById("reroll");
const clearBtn = document.getElementById("clear");
const savedList = document.getElementById("savedList");
const weekBtn = document.getElementById("week");
const addToWeekBtn = document.getElementById("addToWeek");

const weekModal = document.getElementById("weekModal");
const weekDish = document.getElementById("weekDish");
const weekDay = document.getElementById("weekDay");
const confirmWeek = document.getElementById("confirmWeek");
const cancelWeek = document.getElementById("cancelWeek");
const weekStatus = document.getElementById("weekStatus");

const selects = {
  diet: document.getElementById("diet"),
  time: document.getElementById("time"),
  mood: document.getElementById("mood"),
  style: document.getElementById("style"),
};

const weekdays = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];

let lastPick = null;

const getFilters = () => ({
  diet: selects.diet.value,
  time: selects.time.value,
  mood: selects.mood.value,
  style: selects.style.value,
});

const getFiltered = () => {
  const { diet, time, mood, style } = getFilters();

  return dishes.filter((dish) => {
    const dietOk = diet === "all" || dish.diet === diet || dish.diet === "all";
    const timeOk = time === "all" || dish.time === time;
    const moodOk = mood === "all" || dish.mood.includes(mood);
    const styleOk = style === "all" || dish.style === style;
    return dietOk && timeOk && moodOk && styleOk;
  });
};

const renderTags = (tags = []) => {
  tagsEl.innerHTML = "";
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });
  tagsEl.setAttribute("aria-hidden", tags.length ? "false" : "true");
};

const animateDish = () => {
  dishEl.classList.remove("fade-in");
  void dishEl.offsetWidth;
  dishEl.classList.add("fade-in");
};

const pickDish = () => {
  const pool = getFiltered();
  if (!pool.length) {
    dishEl.textContent = "Geen match — probeer andere filters.";
    renderTags([]);
    lastPick = null;
    addToWeekBtn.disabled = true;
    return;
  }
  let pick = pool[Math.floor(Math.random() * pool.length)];
  if (lastPick && pool.length > 1) {
    while (pick.name === lastPick.name) {
      pick = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  lastPick = pick;
  dishEl.textContent = pick.name;
  renderTags(pick.tags);
  animateDish();
  addToWeekBtn.disabled = false;
};

const loadSaved = () => {
  const saved = JSON.parse(localStorage.getItem("whatfood-saved") || "[]");
  savedList.innerHTML = "";
  saved.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "saved-item";
    const span = document.createElement("span");
    span.textContent = item;
    const button = document.createElement("button");
    button.className = "ghost";
    button.textContent = "Verwijder";
    button.addEventListener("click", () => {
      saved.splice(idx, 1);
      localStorage.setItem("whatfood-saved", JSON.stringify(saved));
      loadSaved();
    });
    li.appendChild(span);
    li.appendChild(button);
    savedList.appendChild(li);
  });
};

const openModal = () => {
  if (!lastPick) return;
  weekDish.textContent = lastPick.name;
  weekStatus.textContent = "";
  weekDay.innerHTML = "";
  weekdays.forEach((day, idx) => {
    const option = document.createElement("option");
    option.value = String(idx);
    option.textContent = day;
    weekDay.appendChild(option);
  });
  weekModal.classList.add("show");
  weekModal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  weekModal.classList.remove("show");
  weekModal.setAttribute("aria-hidden", "true");
};

const ensureWeekMeals = () => {
  const rawMeals = localStorage.getItem("whatfood-week");
  let meals = [];
  if (rawMeals) {
    try {
      meals = JSON.parse(rawMeals);
    } catch (err) {
      meals = [];
    }
  }
  if (!meals.length) {
    const pool = getFiltered();
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 7; i += 1) {
      if (shuffled.length) {
        meals.push(shuffled[i % shuffled.length]);
      }
    }
  }
  return meals;
};

const ensureAssignments = () => {
  const raw = localStorage.getItem("whatfood-week-assignments");
  if (!raw) return Array(7).fill(null);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 7) return parsed;
    return Array(7).fill(null);
  } catch (err) {
    return Array(7).fill(null);
  }
};

const handleAddToWeek = () => {
  if (!lastPick) return;
  const dayIdx = Number(weekDay.value);
  if (Number.isNaN(dayIdx)) return;

  let meals = ensureWeekMeals();
  const exists = meals.some((dish) => dish.name === lastPick.name);
  if (!exists) {
    meals = [...meals, lastPick];
  }

  const assignments = ensureAssignments();
  assignments[dayIdx] = lastPick.name;

  localStorage.setItem("whatfood-week", JSON.stringify(meals));
  localStorage.setItem("whatfood-week-assignments", JSON.stringify(assignments));
  localStorage.setItem("whatfood-filters", JSON.stringify(getFilters()));

  weekStatus.textContent = `${lastPick.name} toegevoegd aan ${weekdays[dayIdx]}.`;
};

spinBtn.addEventListener("click", pickDish);
rerollBtn.addEventListener("click", pickDish);
weekBtn.addEventListener("click", () => {
  localStorage.setItem("whatfood-filters", JSON.stringify(getFilters()));
  window.location.href = "planner.html";
});
addToWeekBtn.addEventListener("click", openModal);
confirmWeek.addEventListener("click", handleAddToWeek);
cancelWeek.addEventListener("click", closeModal);
weekModal.addEventListener("click", (event) => {
  if (event.target.classList.contains("modal-backdrop")) {
    closeModal();
  }
});

saveBtn.addEventListener("click", () => {
  if (!lastPick) return;
  const saved = JSON.parse(localStorage.getItem("whatfood-saved") || "[]");
  if (!saved.includes(lastPick.name)) {
    saved.push(lastPick.name);
    localStorage.setItem("whatfood-saved", JSON.stringify(saved));
    loadSaved();
  }
});

clearBtn.addEventListener("click", () => {
  localStorage.removeItem("whatfood-saved");
  loadSaved();
});

Object.values(selects).forEach((select) => {
  select.addEventListener("change", pickDish);
});

loadSaved();
