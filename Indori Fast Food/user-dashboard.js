const USERS_KEY = "indori-fast-food-users";
const USER_SESSION_KEY = "indori-fast-food-user-session";
const ADDRESSES_KEY = "indori-fast-food-addresses";
const ORDERS_KEY = "indori-fast-food-orders";

const emailEl = document.getElementById("user-email");
const createdEl = document.getElementById("user-created");
const avatarCircle = document.getElementById("avatar-circle");

const profileEmailInput = document.getElementById("profile-email");
const profileNameInput = document.getElementById("profile-name");
const profilePhoneInput = document.getElementById("profile-phone");
const profileForm = document.getElementById("profile-form");

const ordersListEl = document.getElementById("orders-list");
const trackContainerEl = document.getElementById("track-container");

const addrNameManage = document.getElementById("addr-name-manage");
const addrPhoneManage = document.getElementById("addr-phone-manage");
const addrLineManage = document.getElementById("addr-line-manage");
const addrCityManage = document.getElementById("addr-city-manage");
const addrPincodeManage = document.getElementById("addr-pincode-manage");
const addressManageForm = document.getElementById("address-manage-form");

const vegOnlyCheckbox = document.getElementById("pref-veg-only");
const saveCartCheckbox = document.getElementById("pref-save-cart");

const logoutBtn = document.getElementById("logout-user-btn");
const sidebarButtons = document.querySelectorAll(".sidebar-item");
const views = document.querySelectorAll(".dash-view");

function readSession() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(USER_SESSION_KEY);
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readAddresses() {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writeAddresses(addressMap) {
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addressMap));
}

function readOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function readPreferences(email) {
  try {
    const raw = localStorage.getItem(`indori-fast-food-prefs-${email}`);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function writePreferences(email, prefs) {
  localStorage.setItem(`indori-fast-food-prefs-${email}`, JSON.stringify(prefs));
}

function requireUser() {
  const session = readSession();
  if (!session || session.role === "admin") {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

function setActiveView(name) {
  views.forEach((view) => {
    view.classList.toggle("hidden", view.id !== `view-${name}`);
  });
  sidebarButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
}

sidebarButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActiveView(btn.dataset.view);
  });
});

logoutBtn.addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});

function init() {
  const session = requireUser();
  if (!session) return;

  const email = session.email;
  emailEl.textContent = email;
  profileEmailInput.value = email;

  const initial = email.charAt(0).toUpperCase();
  avatarCircle.textContent = initial;

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (user && user.createdAt) {
    const date = new Date(user.createdAt);
    createdEl.textContent = `Member since ${date.toLocaleDateString()}`;
  } else {
    createdEl.textContent = "";
  }

  profileNameInput.value = (user && user.name) || "";
  profilePhoneInput.value = (user && user.phone) || "";

  const addresses = readAddresses();
  const address = addresses[email];
  if (address) {
    addrNameManage.value = address.name || "";
    addrPhoneManage.value = address.phone || "";
    addrLineManage.value = address.line || "";
    addrCityManage.value = address.city || "";
    addrPincodeManage.value = address.pincode || "";
  }

  const prefs = readPreferences(email);
  vegOnlyCheckbox.checked = !!prefs.vegOnly;
  saveCartCheckbox.checked = !!prefs.saveCart;

  renderOrders();
  renderTrack();
  setActiveView("profile");
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = readSession();
  if (!session) return;

  const email = session.email;
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === email);
  const current = idx >= 0 ? users[idx] : { email };

  const updated = {
    ...current,
    name: profileNameInput.value.trim(),
    phone: profilePhoneInput.value.trim() || current.phone
  };

  if (idx >= 0) {
    users[idx] = updated;
  } else {
    users.push(updated);
  }

  writeUsers(users);
  alert("Profile updated.");
});

addressManageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const session = readSession();
  if (!session) return;

  const email = session.email;
  const address = {
    name: addrNameManage.value.trim(),
    phone: addrPhoneManage.value.trim(),
    line: addrLineManage.value.trim(),
    city: addrCityManage.value.trim(),
    pincode: addrPincodeManage.value.trim()
  };

  const addresses = readAddresses();
  addresses[email] = address;
  writeAddresses(addresses);
  alert("Address saved.");
});

vegOnlyCheckbox.addEventListener("change", () => {
  const session = readSession();
  if (!session) return;
  const email = session.email;
  const prefs = readPreferences(email);
  prefs.vegOnly = vegOnlyCheckbox.checked;
  writePreferences(email, prefs);
});

saveCartCheckbox.addEventListener("change", () => {
  const session = readSession();
  if (!session) return;
  const email = session.email;
  const prefs = readPreferences(email);
  prefs.saveCart = saveCartCheckbox.checked;
  writePreferences(email, prefs);
});

function renderOrders() {
  const session = readSession();
  if (!session) return;

  const email = session.email;
  const allOrders = readOrders();
  const orders = allOrders[email] || [];

  if (!orders.length) {
    ordersListEl.innerHTML = `
      <div class="empty-state">
        <h3>No orders yet</h3>
        <p>Place your first order from the home page.</p>
      </div>
    `;
    return;
  }

  const fragments = orders
    .map((order) => {
      const time = new Date(order.createdAt).toLocaleString();
      const itemsText = order.items.map((it) => `${it.name} x${it.qty}`).join(", ");
      return `
        <article class="order-card">
          <div class="order-card-header">
            <strong>${order.id}</strong>
            <span>₹${order.total}</span>
          </div>
          <div class="order-items">${itemsText}</div>
          <div class="order-meta">
            <span>${time}</span>
            <span>ETA ~${order.etaMins} min</span>
          </div>
        </article>
      `;
    })
    .join("");

  ordersListEl.innerHTML = fragments;
}

function getLatestOrder() {
  const session = readSession();
  if (!session) return null;
  const email = session.email;
  const allOrders = readOrders();
  const orders = allOrders[email] || [];
  return orders[0] || null;
}

function computeOrderStage(order) {
  if (!order || !order.createdAt) return 0;
  const minutesSince = (Date.now() - order.createdAt) / 60000;
  if (minutesSince < 5) return 0; // placed
  if (minutesSince < 15) return 1; // preparing
  if (minutesSince < order.etaMins) return 2; // on the way
  return 3; // delivered
}

function renderTrack() {
  const latest = getLatestOrder();
  if (!latest) {
    trackContainerEl.innerHTML = `
      <div class="empty-state">
        <h3>No active order</h3>
        <p>Once you place an order, you can track it here.</p>
      </div>
    `;
    return;
  }

  const stage = computeOrderStage(latest);
  const labels = ["Order placed", "Preparing", "On the way", "Delivered"];

  const steps = labels
    .map(
      (label, index) => `
      <div class="track-step ${index <= stage ? "active" : ""}">
        ${label}
      </div>
    `
    )
    .join("");

  const time = new Date(latest.createdAt).toLocaleString();

  trackContainerEl.innerHTML = `
    <article class="order-card">
      <div class="order-card-header">
        <strong>${latest.id}</strong>
        <span>₹${latest.total}</span>
      </div>
      <p class="muted-small" style="margin-bottom:8px;">Placed at ${time}</p>
      <div class="track-timeline">
        ${steps}
      </div>
    </article>
  `;
}

init();

