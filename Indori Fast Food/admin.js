const STORAGE_KEY = "indori-fast-food-menu";
const ADMIN_SESSION_KEY = "indori-fast-food-admin-session";
const USER_SESSION_KEY = "indori-fast-food-user-session";

const DEMO_ADMIN_ID = "admin@indorifastfood.com";
const DEMO_ADMIN_PASSWORD = "Indori@123";

const panelView = document.getElementById("admin-panel-view");

const adminEmailLabel = document.getElementById("admin-email-label");
const logoutBtn = document.getElementById("logout-btn");

const menuForm = document.getElementById("menu-form");
const menuIdInput = document.getElementById("menu-id");
const menuNameInput = document.getElementById("menu-name");
const menuDescriptionInput = document.getElementById("menu-description");
const menuPriceInput = document.getElementById("menu-price");
const menuCategorySelect = document.getElementById("menu-category");
const menuImageUrlInput = document.getElementById("menu-image-url");
const menuIsVegInput = document.getElementById("menu-is-veg");
const menuPrepTimeInput = document.getElementById("menu-prep-time");
const menuSpiceLevelInput = document.getElementById("menu-spice-level");
const menuTaglineInput = document.getElementById("menu-tagline");
const resetFormBtn = document.getElementById("reset-form-btn");
const restoreSampleBtn = document.getElementById("restore-sample-btn");
const menuTableBody = document.getElementById("menu-table-body");

let menuItems = [];

function readUserSession() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readMenu() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeMenu(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

async function loadSampleMenuFromFile() {
  try {
    const response = await fetch("menu.json");
    if (!response.ok) {
      throw new Error("Failed to read sample menu.json");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function ensureMenuLoaded() {
  const stored = readMenu();
  if (stored && stored.length) {
    menuItems = stored;
    renderTable();
    return;
  }

  const sample = await loadSampleMenuFromFile();
  if (sample.length) {
    menuItems = sample;
    writeMenu(menuItems);
    renderTable();
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(USER_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.href = "index.html";
});

function handleMenuSubmit(event) {
  event.preventDefault();

  const id = menuIdInput.value || generateIdFromName(menuNameInput.value);

  const item = {
    id,
    name: menuNameInput.value.trim(),
    description: menuDescriptionInput.value.trim(),
    price: Number(menuPriceInput.value),
    category: menuCategorySelect.value,
    imageUrl: menuImageUrlInput.value.trim(),
    isVeg: menuIsVegInput.checked,
    prepTime: menuPrepTimeInput.value.trim() || "20 min",
    spiceLevel: menuSpiceLevelInput.value.trim() || "Medium",
    tagline: menuTaglineInput.value.trim() || "Indori Favourite",
    rating: 4.5
  };

  const existingIndex = menuItems.findIndex((entry) => entry.id === id);
  if (existingIndex >= 0) {
    menuItems[existingIndex] = item;
  } else {
    menuItems.push(item);
  }

  writeMenu(menuItems);
  renderTable();
  resetForm();
}

menuForm.addEventListener("submit", handleMenuSubmit);

resetFormBtn.addEventListener("click", resetForm);

function resetForm() {
  menuIdInput.value = "";
  menuForm.reset();
  menuIsVegInput.checked = true;
}

function generateIdFromName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Date.now();
}

function renderTable() {
  if (!menuItems.length) {
    menuTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">No menu items found. Use the form to add your first item.</td>
      </tr>
    `;
    return;
  }

  const rows = menuItems
    .map(
      (item) => `
      <tr data-id="${item.id}">
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>₹${item.price}</td>
        <td>${item.isVeg ? "Veg" : "Non-veg"}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn" data-action="edit">Edit</button>
            <button class="action-btn danger" data-action="delete">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  menuTableBody.innerHTML = rows;
}

menuTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const row = button.closest("tr[data-id]");
  if (!row) return;

  const id = row.dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    const item = menuItems.find((entry) => entry.id === id);
    if (!item) return;
    fillFormForEdit(item);
  } else if (action === "delete") {
    const confirmDelete = confirm("Remove this food from menu? This will also disappear from user site.");
    if (!confirmDelete) return;
    menuItems = menuItems.filter((entry) => entry.id !== id);
    writeMenu(menuItems);
    renderTable();
  }
});

function fillFormForEdit(item) {
  menuIdInput.value = item.id;
  menuNameInput.value = item.name;
  menuDescriptionInput.value = item.description;
  menuPriceInput.value = item.price;
  menuCategorySelect.value = item.category;
  menuImageUrlInput.value = item.imageUrl;
  menuIsVegInput.checked = !!item.isVeg;
  menuPrepTimeInput.value = item.prepTime || "";
  menuSpiceLevelInput.value = item.spiceLevel || "";
  menuTaglineInput.value = item.tagline || "";
}

restoreSampleBtn.addEventListener("click", async () => {
  const confirmRestore = confirm("Restore sample data? This will overwrite your current menu.");
  if (!confirmRestore) return;

  const sample = await loadSampleMenuFromFile();
  if (!sample.length) {
    alert("Could not load sample data. Make sure menu.json exists.");
    return;
  }
  menuItems = sample;
  writeMenu(menuItems);
  renderTable();
});

(function init() {
  const session = readUserSession();
  const isAdmin = session && session.email === DEMO_ADMIN_ID && session.role === "admin";
  if (!isAdmin) {
    window.location.href = "index.html?login=1&as=admin";
    return;
  }

  panelView.classList.remove("hidden");
  adminEmailLabel.textContent = session.email;
  ensureMenuLoaded();
})();

