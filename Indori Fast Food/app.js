const STORAGE_KEY = "indori-fast-food-menu";

const menuGrid = document.getElementById("menu-grid");
const emptyState = document.getElementById("menu-empty-state");
const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-btn");
const sortSelect = document.getElementById("sort-select");
const yearEl = document.getElementById("year");

const imageErrorModal = document.getElementById("image-error-modal");
const imageErrorText = document.getElementById("image-error-text");
const closeImageModalBtn = document.getElementById("close-image-modal");

const cartDrawer = document.getElementById("cart-drawer");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartCountEl = document.getElementById("cart-count");
const viewCartBtn = document.getElementById("view-cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const checkoutBtn = document.getElementById("checkout-btn");

const openLoginBtn = document.getElementById("open-login-btn");

const authModal = document.getElementById("auth-modal");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authForm = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const authCloseBtn = document.getElementById("auth-close-btn");
const authFootnote = document.getElementById("auth-footnote");

const checkoutModal = document.getElementById("checkout-modal");
const stepBadges = document.querySelectorAll(".step");
const stepAddress = document.getElementById("step-address");
const stepPayment = document.getElementById("step-payment");
const stepConfirm = document.getElementById("step-confirm");

const addressForm = document.getElementById("address-form");
const addrName = document.getElementById("addr-name");
const addrPhone = document.getElementById("addr-phone");
const addrLine = document.getElementById("addr-line");
const addrCity = document.getElementById("addr-city");
const addrPincode = document.getElementById("addr-pincode");

const paymentForm = document.getElementById("payment-form");
const payUpiBlock = document.getElementById("pay-upi");
const payCardBlock = document.getElementById("pay-card");
const upiIdInput = document.getElementById("upi-id");
const cardNumberInput = document.getElementById("card-number");
const cardExpiryInput = document.getElementById("card-expiry");
const cardCvvInput = document.getElementById("card-cvv");
const backToAddressBtn = document.getElementById("back-to-address-btn");

const confirmEmailEl = document.getElementById("confirm-email");
const confirmAddressEl = document.getElementById("confirm-address");
const confirmPaymentEl = document.getElementById("confirm-payment");
const confirmTotalEl = document.getElementById("confirm-total");
const confirmItemsListEl = document.getElementById("confirm-items-list");
const placeOrderFinalBtn = document.getElementById("place-order-final-btn");
const backToPaymentBtn = document.getElementById("back-to-payment-btn");
const checkoutCloseBtn = document.getElementById("checkout-close-btn");

const successModal = document.getElementById("success-modal");
const successText = document.getElementById("success-text");
const successHomeBtn = document.getElementById("success-home-btn");

const supportForm = document.getElementById("support-form");
const supportNameInput = document.getElementById("support-name");
const supportEmailInput = document.getElementById("support-email");
const supportPhoneInput = document.getElementById("support-phone");
const supportOrderIdInput = document.getElementById("support-order-id");
const supportTopicSelect = document.getElementById("support-topic");
const supportMessageInput = document.getElementById("support-message");

const supportSuccessModal = document.getElementById("support-success-modal");
const supportSuccessText = document.getElementById("support-success-text");
const supportSuccessClose = document.getElementById("support-success-close");

let allItems = [];
let cart = [];
let lastFailedImageItem = null;

const USERS_KEY = "indori-fast-food-users";
const USER_SESSION_KEY = "indori-fast-food-user-session";
const ADDRESSES_KEY = "indori-fast-food-addresses";
const ORDERS_KEY = "indori-fast-food-orders";
const SUPPORT_TICKETS_KEY = "indori-fast-food-support-tickets";

const ADMIN_EMAIL = "admin@indorifastfood.com";
const ADMIN_PASSWORD = "Indori@123";

let authMode = "login";
let postAuthAction = null;
let checkoutState = {
  address: null,
  payment: null
};

let authContext = {
  adminOnly: false
};

yearEl.textContent = new Date().getFullYear();

function readMenuFromStorage() {
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

async function loadMenuFromFile() {
  const response = await fetch("menu.json");
  if (!response.ok) {
    throw new Error("Unable to load menu data");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.items || [];
}

async function loadMenu() {
  try {
    const stored = readMenuFromStorage();
    if (stored && stored.length) {
      allItems = stored;
      renderMenu();
      return;
    }

    const fileItems = await loadMenuFromFile();
    allItems = fileItems;
    renderMenu();
  } catch (error) {
    console.error(error);
    menuGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.querySelector("h3").textContent = "Menu could not be loaded";
    emptyState.querySelector("p").textContent =
      "Check that local menu data or menu.json is available when running via Live Server.";
  }
}

function getActiveFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const activeCategoryBtn = document.querySelector(".filter-btn.active");
  const category = activeCategoryBtn ? activeCategoryBtn.dataset.category : "all";
  const sortBy = sortSelect.value;
  return { searchTerm, category, sortBy };
}

function applyFilters(items) {
  const { searchTerm, category } = getActiveFilters();
  let filtered = [...items];

  if (category !== "all") {
    filtered = filtered.filter((item) => item.category === category);
  }

  if (searchTerm) {
    filtered = filtered.filter((item) => {
      const haystack = `${item.name} ${item.description || ""}`.toLowerCase();
      return haystack.includes(searchTerm);
    });
  }

  return filtered;
}

function applySorting(items) {
  const { sortBy } = getActiveFilters();
  const sorted = [...items];

  if (sortBy === "price-low-high") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high-low") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sortBy === "name-az") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

function renderMenu() {
  const filtered = applySorting(applyFilters(allItems));

  if (!filtered.length) {
    menuGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  const fragment = document.createDocumentFragment();

  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className = `food-card ${item.isVeg ? "veg" : "non-veg"}`;
    card.dataset.id = item.id;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "food-image-wrapper";

    const img = document.createElement("img");
    img.src = item.imageUrl;
    img.alt = item.name;
    img.loading = "lazy";
    img.addEventListener("error", () => handleImageError(item, img));

    const vegIndicator = document.createElement("span");
    vegIndicator.className = "veg-indicator";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = item.tagline || "Indori Favourite";

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(vegIndicator);
    imageWrapper.appendChild(badge);

    const body = document.createElement("div");
    body.className = "food-body";

    const titleRow = document.createElement("div");
    titleRow.className = "food-title-row";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const rating = document.createElement("div");
    rating.className = "rating";
    rating.innerHTML = `<span>★</span><span>${item.rating.toFixed(1)}</span>`;

    titleRow.appendChild(title);
    titleRow.appendChild(rating);

    const description = document.createElement("p");
    description.className = "food-description";
    description.textContent = item.description;

    const footer = document.createElement("div");
    footer.className = "food-footer";

    const left = document.createElement("div");

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `₹${item.price}`;

    const meta = document.createElement("div");
    meta.className = "food-meta";
    meta.textContent = `${item.prepTime} • ${item.spiceLevel}`;

    left.appendChild(price);
    left.appendChild(meta);

    const addBtn = document.createElement("button");
    addBtn.className = "btn ghost";
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", () => addToCart(item));

    footer.appendChild(left);
    footer.appendChild(addBtn);

    body.appendChild(titleRow);
    body.appendChild(description);
    body.appendChild(footer);

    const qtyBadge = document.createElement("span");
    qtyBadge.className = "badge-qty hidden";
    qtyBadge.textContent = "x1";
    qtyBadge.dataset.badgeFor = item.id;

    card.appendChild(imageWrapper);
    card.appendChild(body);
    card.appendChild(qtyBadge);

    fragment.appendChild(card);
  });

  menuGrid.innerHTML = "";
  menuGrid.appendChild(fragment);
  syncCardBadgesWithCart();
}

function handleImageError(item, imgElement) {
  lastFailedImageItem = item;

  if (imgElement) {
    imgElement.style.opacity = "0";
  }

  const fallback = document.createElement("div");
  fallback.style.height = "100%";
  fallback.style.display = "flex";
  fallback.style.flexDirection = "column";
  fallback.style.alignItems = "center";
  fallback.style.justifyContent = "center";
  fallback.style.background = "rgba(15, 23, 42, 0.9)";
  fallback.innerHTML = `
    <span style="font-size: 1.4rem; margin-bottom: 6px;">🍽️</span>
    <span style="font-size: 0.85rem; color: #9ca3af;">Preview not available</span>
  `;

  const wrapper = imgElement.parentElement;
  if (wrapper) {
    wrapper.appendChild(fallback);
  }

  imageErrorText.textContent = `Image for "${item.name}" could not be loaded. Please check the image URL in the admin panel.`;
  imageErrorModal.classList.remove("hidden");
  imageErrorModal.setAttribute("aria-hidden", "false");
}

closeImageModalBtn.addEventListener("click", () => {
  imageErrorModal.classList.add("hidden");
  imageErrorModal.setAttribute("aria-hidden", "true");
});

imageErrorModal.addEventListener("click", (event) => {
  if (event.target === imageErrorModal || event.target.classList.contains("modal-backdrop")) {
    imageErrorModal.classList.add("hidden");
    imageErrorModal.setAttribute("aria-hidden", "true");
  }
});

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("hidden");
  modalEl.setAttribute("aria-hidden", "false");
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("hidden");
  modalEl.setAttribute("aria-hidden", "true");
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

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  updateLoginButton();
}

function clearCurrentUser() {
  localStorage.removeItem(USER_SESSION_KEY);
  updateLoginButton();
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

function writeOrders(orderMap) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orderMap));
}

function updateLoginButton() {
  const user = getCurrentUser();
  if (!openLoginBtn) return;

  if (!user) {
    openLoginBtn.textContent = "Login";
    openLoginBtn.dataset.state = "logged-out";
    return;
  }

  openLoginBtn.textContent = "Profile";
  openLoginBtn.dataset.state = "logged-in";
}

function setAuthMode(nextMode) {
  authMode = nextMode;
  const isLogin = authMode === "login";
  authTitle.textContent = isLogin ? "Login" : "Create Account";
  authSubtitle.textContent = isLogin ? "Log in to continue with your order." : "Create your account to place an order.";
  authSubmitBtn.textContent = isLogin ? "Login" : "Create Account";
  authToggleBtn.textContent = isLogin ? "Create a new account" : "I already have an account";
  authPasswordInput.autocomplete = isLogin ? "current-password" : "new-password";
  authFootnote.textContent = "Your account is stored on this device (localStorage).";
}

function openAuth(actionAfterLogin = null) {
  postAuthAction = actionAfterLogin;
  setAuthMode("login");
  authContext = { adminOnly: false };
  authToggleBtn.classList.remove("hidden");
  authEmailInput.value = "";
  authPasswordInput.value = "";
  openModal(authModal);
  authEmailInput.focus();
}

function openAuthAdmin() {
  postAuthAction = null;
  setAuthMode("login");
  authContext = { adminOnly: true };
  authToggleBtn.classList.add("hidden");
  authEmailInput.value = ADMIN_EMAIL;
  authPasswordInput.value = "";
  authSubtitle.textContent = "Admin access only. Log in to open the admin dashboard.";
  openModal(authModal);
  authPasswordInput.focus();
}

function closeAuth() {
  closeModal(authModal);
  authForm.reset();
  postAuthAction = null;
  authContext = { adminOnly: false };
  authToggleBtn.classList.remove("hidden");
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = authEmailInput.value.trim().toLowerCase();
  const password = authPasswordInput.value;

  if (!email || !password) return;

  const users = readUsers();
  const existing = users.find((u) => u.email === email);

  const isAdminCredentials = email === ADMIN_EMAIL && password === ADMIN_PASSWORD;

  if (authMode === "login") {
    if (isAdminCredentials) {
      setCurrentUser({ email, role: "admin", loggedInAt: Date.now() });
      closeAuth();
      if (postAuthAction === "checkout") {
        alert("Please place customer orders from a user account, not from the admin account.");
      }
      return;
    }

    if (authContext.adminOnly) {
      alert("Invalid admin credentials.");
      return;
    }

    if (!existing || existing.password !== password) {
      alert("Invalid email or password.");
      return;
    }
    setCurrentUser({ email, role: "user", loggedInAt: Date.now() });
    closeAuth();
    if (postAuthAction === "checkout") {
      openCheckout();
    }
    return;
  }

  if (existing) {
    alert("Account already exists. Please log in instead.");
    setAuthMode("login");
    return;
  }

  users.push({ email, password, createdAt: Date.now() });
  writeUsers(users);
  setCurrentUser({ email, role: "user", loggedInAt: Date.now() });
  closeAuth();
  if (postAuthAction === "checkout") {
    openCheckout();
  }
}

authForm.addEventListener("submit", handleAuthSubmit);

authToggleBtn.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
});

authCloseBtn.addEventListener("click", closeAuth);

authModal.addEventListener("click", (event) => {
  if (event.target === authModal || event.target.classList.contains("modal-backdrop")) {
    closeAuth();
  }
});

openLoginBtn.addEventListener("click", () => {
  const user = getCurrentUser();
  if (!user) {
    openAuth(null);
    return;
  }

  const role = user.role || "user";
  if (role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "user-dashboard.html";
  }
});

function setActiveStep(stepName) {
  const allSteps = ["address", "payment", "confirm"];
  const stepMap = {
    address: stepAddress,
    payment: stepPayment,
    confirm: stepConfirm
  };

  allSteps.forEach((name) => {
    const el = stepMap[name];
    if (!el) return;
    if (name === stepName) {
      el.classList.remove("hidden");
    } else {
      el.classList.add("hidden");
    }
  });

  stepBadges.forEach((badge) => {
    badge.classList.toggle("active", badge.dataset.step === stepName);
  });
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function openCheckout() {
  if (!cart.length) {
    alert("Your cart is empty. Add something first.");
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    openAuth("checkout");
    return;
  }

  closeCart();

  const addresses = readAddresses();
  const savedAddress = addresses[user.email] || null;
  if (savedAddress) {
    addrName.value = savedAddress.name || "";
    addrPhone.value = savedAddress.phone || "";
    addrLine.value = savedAddress.line || "";
    addrCity.value = savedAddress.city || "";
    addrPincode.value = savedAddress.pincode || "";
  } else {
    addressForm.reset();
  }

  checkoutState = { address: null, payment: null };
  setActiveStep("address");
  openModal(checkoutModal);
}

function closeCheckout() {
  closeModal(checkoutModal);
  setActiveStep("address");
}

checkoutModal.addEventListener("click", (event) => {
  if (event.target === checkoutModal || event.target.classList.contains("modal-backdrop")) {
    closeCheckout();
  }
});

function normalizePhone(value) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function normalizePincode(value) {
  return value.replace(/\D/g, "").slice(0, 6);
}

addrPhone.addEventListener("input", () => {
  addrPhone.value = normalizePhone(addrPhone.value);
});

addrPincode.addEventListener("input", () => {
  addrPincode.value = normalizePincode(addrPincode.value);
});

function initSupportForm() {
  if (!supportForm) return;

  const user = getCurrentUser();
  if (user && supportEmailInput) {
    supportEmailInput.value = user.email;
  }

  supportPhoneInput?.addEventListener("input", () => {
    supportPhoneInput.value = normalizePhone(supportPhoneInput.value);
  });

  supportSuccessClose?.addEventListener("click", () => {
    closeModal(supportSuccessModal);
  });

  supportSuccessModal?.addEventListener("click", (event) => {
    if (event.target === supportSuccessModal || event.target.classList.contains("modal-backdrop")) {
      closeModal(supportSuccessModal);
    }
  });

  supportForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const ticket = {
      id: `SUP-${Date.now().toString(36).toUpperCase()}`,
      name: supportNameInput.value.trim(),
      email: supportEmailInput.value.trim().toLowerCase(),
      phone: normalizePhone(supportPhoneInput.value.trim() || ""),
      orderId: supportOrderIdInput.value.trim(),
      topic: supportTopicSelect.value,
      message: supportMessageInput.value.trim(),
      createdAt: Date.now()
    };

    try {
      const raw = localStorage.getItem(SUPPORT_TICKETS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const safeList = Array.isArray(list) ? list : [];
      safeList.unshift(ticket);
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify(safeList));
    } catch {
      localStorage.setItem(SUPPORT_TICKETS_KEY, JSON.stringify([ticket]));
    }

    supportForm.reset();
    const current = getCurrentUser();
    if (current) supportEmailInput.value = current.email;

    supportSuccessText.textContent = `Thanks, ${ticket.name}. Your request has been saved with ticket ID ${ticket.id}.`;
    openModal(supportSuccessModal);
  });
}

addressForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const phone = normalizePhone(addrPhone.value.trim());
  const pincode = normalizePincode(addrPincode.value.trim());

  if (phone.length !== 10) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  if (pincode.length !== 6) {
    alert("Please enter a valid 6-digit pincode.");
    return;
  }

  const address = {
    name: addrName.value.trim(),
    phone,
    line: addrLine.value.trim(),
    city: addrCity.value.trim(),
    pincode
  };

  const user = getCurrentUser();
  if (user) {
    const addresses = readAddresses();
    addresses[user.email] = address;
    writeAddresses(addresses);
  }

  checkoutState.address = address;
  setActiveStep("payment");
});

function getSelectedPaymentMethod() {
  const selected = paymentForm.querySelector('input[name="pay-method"]:checked');
  return selected ? selected.value : "upi";
}

function updatePaymentBlocks() {
  const method = getSelectedPaymentMethod();
  payUpiBlock.classList.toggle("hidden", method !== "upi");
  payCardBlock.classList.toggle("hidden", method !== "card");
}

paymentForm.addEventListener("change", (event) => {
  if (event.target && event.target.name === "pay-method") {
    updatePaymentBlocks();
  }
});

updatePaymentBlocks();

backToAddressBtn.addEventListener("click", () => {
  setActiveStep("address");
});

paymentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const method = getSelectedPaymentMethod();
  if (method === "upi") {
    const upi = upiIdInput.value.trim();
    if (!upi || !upi.includes("@")) {
      alert("Please enter a valid UPI ID.");
      return;
    }
    checkoutState.payment = { method: "UPI", details: upi };
  } else if (method === "card") {
    const number = cardNumberInput.value.replace(/\s+/g, "").trim();
    const expiry = cardExpiryInput.value.trim();
    const cvv = cardCvvInput.value.trim();
    if (number.length < 12) {
      alert("Please enter a valid card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      alert("Please enter expiry in MM/YY format.");
      return;
    }
    if (cvv.length < 3) {
      alert("Please enter a valid CVV.");
      return;
    }
    checkoutState.payment = { method: "Card", details: `**** ${number.slice(-4)}` };
  } else {
    checkoutState.payment = { method: "Cash on Delivery", details: "Pay at delivery" };
  }

  const user = getCurrentUser();
  const total = getCartTotal();

  if (confirmItemsListEl) {
    const rows = cart
      .map((item) => {
        const lineTotal = item.price * item.qty;
        return `
          <div class="confirm-item-row">
            <div>
              <div class="confirm-item-title">${item.name}</div>
              <div class="confirm-item-meta">₹${item.price} × ${item.qty}</div>
            </div>
            <div class="confirm-item-right">₹${lineTotal}</div>
          </div>
        `;
      })
      .join("");

    confirmItemsListEl.innerHTML = rows;
  }

  confirmEmailEl.textContent = user ? user.email : "";
  confirmAddressEl.textContent = `${checkoutState.address.name}, ${checkoutState.address.phone}\n${checkoutState.address.line}, ${checkoutState.address.city} - ${checkoutState.address.pincode}`;
  confirmPaymentEl.textContent = `${checkoutState.payment.method} • ${checkoutState.payment.details}`;
  confirmTotalEl.textContent = `₹${total}`;

  setActiveStep("confirm");
});

backToPaymentBtn.addEventListener("click", () => {
  setActiveStep("payment");
});

checkoutCloseBtn.addEventListener("click", closeCheckout);

function generateOrderId() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1e6).toString(36).toUpperCase();
  return `IFF-${now}-${rand}`;
}

placeOrderFinalBtn.addEventListener("click", () => {
  if (!checkoutState.address || !checkoutState.payment) {
    alert("Please complete address and payment details.");
    setActiveStep("address");
    return;
  }

  const orderId = generateOrderId();
  const total = getCartTotal();
  const etaMins = 25 + Math.floor(Math.random() * 20);
  const user = getCurrentUser();

  if (user) {
    const orders = readOrders();
    const current = orders[user.email] || [];
    const snapshotItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty
    }));

    const newOrder = {
      id: orderId,
      total,
      items: snapshotItems,
      address: checkoutState.address,
      payment: checkoutState.payment,
      createdAt: Date.now(),
      etaMins
    };

    current.unshift(newOrder);
    orders[user.email] = current;
    writeOrders(orders);
  }

  closeCheckout();
  closeCart();

  successText.textContent = `Order ${orderId} confirmed.\n\nEstimated delivery: ${etaMins} minutes.\nTotal paid: ₹${total}`;
  openModal(successModal);

  cart = [];
  renderCart();
  syncCardBadgesWithCart();
});

successHomeBtn.addEventListener("click", () => {
  closeModal(successModal);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

successModal.addEventListener("click", (event) => {
  if (event.target === successModal || event.target.classList.contains("modal-backdrop")) {
    closeModal(successModal);
  }
});

function addToCart(item) {
  const existing = cart.find((entry) => entry.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  renderCart();
  syncCardBadgesWithCart();
}

function removeFromCart(id) {
  cart = cart.filter((entry) => entry.id !== id);
  renderCart();
  syncCardBadgesWithCart();
}

function changeQuantity(id, delta) {
  const entry = cart.find((item) => item.id === id);
  if (!entry) return;

  const next = entry.qty + delta;
  if (next <= 0) {
    removeFromCart(id);
    return;
  }
  entry.qty = next;
  renderCart();
  syncCardBadgesWithCart();
}

function renderCart() {
  if (!cart.length) {
    cartItemsEl.innerHTML = `
      <div class="empty-state">
        <h3>Cart is empty</h3>
        <p>Add some Indori favourites to get started.</p>
      </div>
    `;
    cartTotalEl.textContent = "₹0";
    cartCountEl.textContent = "0";
    return;
  }

  const fragment = document.createDocumentFragment();
  let total = 0;
  let totalItems = 0;

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-item";

    const titlePart = document.createElement("div");
    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "cart-item-meta";
    meta.textContent = `₹${item.price} × ${item.qty}`;

    titlePart.appendChild(title);
    titlePart.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "cart-item-actions";

    const minus = document.createElement("button");
    minus.className = "qty-btn";
    minus.textContent = "−";
    minus.addEventListener("click", () => changeQuantity(item.id, -1));

    const quantity = document.createElement("span");
    quantity.textContent = item.qty;

    const plus = document.createElement("button");
    plus.className = "qty-btn";
    plus.textContent = "+";
    plus.addEventListener("click", () => changeQuantity(item.id, 1));

    const removeBtn = document.createElement("button");
    removeBtn.className = "qty-btn";
    removeBtn.textContent = "✕";
    removeBtn.title = "Remove from cart";
    removeBtn.addEventListener("click", () => removeFromCart(item.id));

    actions.appendChild(minus);
    actions.appendChild(quantity);
    actions.appendChild(plus);
    actions.appendChild(removeBtn);

    row.appendChild(titlePart);
    row.appendChild(actions);

    fragment.appendChild(row);

    total += item.price * item.qty;
    totalItems += item.qty;
  });

  cartItemsEl.innerHTML = "";
  cartItemsEl.appendChild(fragment);
  cartTotalEl.textContent = `₹${total}`;
  cartCountEl.textContent = String(totalItems);
}

function syncCardBadgesWithCart() {
  const badges = document.querySelectorAll(".badge-qty");
  badges.forEach((badge) => {
    const id = badge.dataset.badgeFor;
    const entry = cart.find((item) => String(item.id) === String(id));
    if (!entry) {
      badge.classList.add("hidden");
      return;
    }
    badge.classList.remove("hidden");
    badge.textContent = `x${entry.qty}`;
  });
}

function openCart() {
  cartDrawer.classList.add("open");
}

function closeCart() {
  cartDrawer.classList.remove("open");
}

viewCartBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);

checkoutBtn.addEventListener("click", () => {
  openCheckout();
});

searchInput.addEventListener("input", () => {
  renderMenu();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    renderMenu();
  });
});

sortSelect.addEventListener("change", () => {
  renderMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    imageErrorModal.classList.add("hidden");
    imageErrorModal.setAttribute("aria-hidden", "true");
    closeAuth();
    closeCheckout();
    closeModal(successModal);
  }
});

updateLoginButton();
loadMenu();
initSupportForm();

(function handleLoginRedirectParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("login") !== "1") return;

  const as = params.get("as");
  if (as === "admin") {
    openAuthAdmin();
  } else {
    openAuth(null);
  }

  window.history.replaceState({}, "", window.location.pathname);
})();

