const weekList = document.getElementById("weekList");
const shopList = document.getElementById("shopList");
const regenerateBtn = document.getElementById("regenerate");
const backBtn = document.getElementById("back");
const poolList = document.getElementById("poolList");
const poolCount = document.getElementById("poolCount");

const weekdays = [
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
  "Zondag",
];

let weekMeals = [];
let weekAssignments = Array(7).fill(null);

const loadFilters = () => {
  const raw = localStorage.getItem("whatfood-filters");
  if (!raw) {
    return { diet: "all", time: "all", mood: "all", style: "all" };
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    return { diet: "all", time: "all", mood: "all", style: "all" };
  }
};

const getFiltered = () => {
  const { diet, time, mood, style } = loadFilters();
  return dishes.filter((dish) => {
    const dietOk = diet === "all" || dish.diet === diet || dish.diet === "all";
    const timeOk = time === "all" || dish.time === time;
    const moodOk = mood === "all" || dish.mood.includes(mood);
    const styleOk = style === "all" || dish.style === style;
    return dietOk && timeOk && moodOk && styleOk;
  });
};

const saveState = () => {
  localStorage.setItem("whatfood-week", JSON.stringify(weekMeals));
  localStorage.setItem("whatfood-week-assignments", JSON.stringify(weekAssignments));
};

const loadState = () => {
  const mealsRaw = localStorage.getItem("whatfood-week");
  const assignRaw = localStorage.getItem("whatfood-week-assignments");
  try {
    weekMeals = mealsRaw ? JSON.parse(mealsRaw) : [];
  } catch (err) {
    weekMeals = [];
  }
  try {
    weekAssignments = assignRaw ? JSON.parse(assignRaw) : Array(7).fill(null);
  } catch (err) {
    weekAssignments = Array(7).fill(null);
  }
};

const generateWeekPlan = () => {
  const pool = getFiltered();
  if (!pool.length) {
    weekMeals = [];
    weekAssignments = Array(7).fill(null);
    return;
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  weekMeals = [];
  for (let i = 0; i < 7; i += 1) {
    weekMeals.push(shuffled[i % shuffled.length]);
  }
  weekAssignments = Array(7).fill(null);
  saveState();
};

const createMealCard = (dish) => {
  const card = document.createElement("div");
  card.className = "meal-card";
  card.draggable = true;
  card.dataset.name = dish.name;
  card.innerHTML = `
    <strong>${dish.name}</strong>
    <span>${dish.tags.join(" · ")}</span>
  `;

  card.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", dish.name);
    event.dataTransfer.setData("source", "pool");
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
};

const renderPool = () => {
  poolList.innerHTML = "";
  const assigned = new Set(weekAssignments.filter(Boolean));
  const available = weekMeals.filter((dish) => !assigned.has(dish.name));
  poolCount.textContent = `${available.length} over`;

  if (!available.length) {
    const empty = document.createElement("div");
    empty.className = "pool-empty";
    empty.textContent = "Alles ingepland. Sleep terug om te wisselen.";
    poolList.appendChild(empty);
    return;
  }

  available.forEach((dish) => {
    poolList.appendChild(createMealCard(dish));
  });
};

const renderWeekPlan = () => {
  weekList.innerHTML = "";
  weekdays.forEach((day, idx) => {
    const li = document.createElement("li");
    li.className = "week-item";
    li.dataset.day = String(idx);

    const label = document.createElement("span");
    label.textContent = day;

    const slot = document.createElement("div");
    slot.className = "day-slot";
    slot.textContent = weekAssignments[idx] || "Sleep gerecht hier";

    if (weekAssignments[idx]) {
      slot.classList.add("filled");
      slot.setAttribute("draggable", "true");
      slot.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", weekAssignments[idx]);
        event.dataTransfer.setData("source", "day");
        event.dataTransfer.setData("day", String(idx));
        slot.classList.add("dragging");
      });
      slot.addEventListener("dragend", () => {
        slot.classList.remove("dragging");
      });
    }

    li.addEventListener("dragover", (event) => {
      event.preventDefault();
      li.classList.add("drag-over");
    });

    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over");
    });

    li.addEventListener("drop", (event) => {
      event.preventDefault();
      li.classList.remove("drag-over");
      const dishName = event.dataTransfer.getData("text/plain");
      if (!dishName) return;

      const source = event.dataTransfer.getData("source");
      const fromDay = event.dataTransfer.getData("day");

      if (source === "day" && fromDay === String(idx)) return;

      const current = weekAssignments[idx];
      weekAssignments[idx] = dishName;

      if (source === "day" && fromDay !== "") {
        const fromIdx = Number(fromDay);
        if (!Number.isNaN(fromIdx)) {
          weekAssignments[fromIdx] = current || null;
        }
      }

      saveState();
      renderWeekPlan();
      renderPool();
      renderShoppingList();
    });

    li.appendChild(label);
    li.appendChild(slot);
    weekList.appendChild(li);
  });
};

const renderShoppingList = () => {
  const counts = new Map();
  weekAssignments
    .filter(Boolean)
    .forEach((name) => {
      const dish = weekMeals.find((item) => item.name === name);
      if (!dish) return;
      dish.ingredients.forEach((item) => {
        counts.set(item, (counts.get(item) || 0) + 1);
      });
    });

  shopList.innerHTML = "";
  if (!counts.size) {
    const li = document.createElement("li");
    li.textContent = "Nog niets ingepland.";
    shopList.appendChild(li);
    return;
  }

  Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([item, count]) => {
      const li = document.createElement("li");
      li.textContent = count > 1 ? `${item} x${count}` : item;
      shopList.appendChild(li);
    });
};

const init = () => {
  loadState();
  if (!weekMeals.length) {
    generateWeekPlan();
  }
  renderWeekPlan();
  renderPool();
  renderShoppingList();
};

regenerateBtn.addEventListener("click", () => {
  generateWeekPlan();
  renderWeekPlan();
  renderPool();
  renderShoppingList();
});

backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

init();
