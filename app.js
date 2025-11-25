// VARIABLES & CONSTANTS

let extensions = [];
const cardsContainer = document.querySelector(".extensions-list");
const filter = document.querySelector(".filter");
const filterButtons = filter.querySelectorAll(".filter-btn");

// HELPER/UTILITY FUNCTIONS

const cloneTemplate = (id) => {
  const template = document.getElementById(id);
  const clone = template.content.cloneNode(true);
  return clone;
};

const generateUUID = () => {
  // Generate a simple, collision-resistant UUID (Universally Unique Identifier)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// DATA MANAGEMENT

const initializeData = (data) => {
  return data.map((item) => ({
    ...item,
    // If you already have an ID (loaded from local storage), use it; if not, generate a new one.
    id: item.id || generateUUID(),
  }));
};

const syncExtensionsToLocalStorage = () => {
  localStorage.setItem("extensionsData", JSON.stringify(extensions));
};

const loadExtensions = async () => {
  const storedData = localStorage.getItem("extensionsData");
  let initialData;

  if (storedData) {
    // There is saved state.
    initialData = JSON.parse(storedData);
    // If IDs are missing (migration), we initialize them:
    extensions = initializeData(initialData);
  } else {
    // No saved state. We fetch the data.json (Base Data)
    try {
      const response = await fetch("data.json");
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      initialData = await response.json();

      // We assigned permanent IDs to the raw data for the first time.
      extensions = initializeData(initialData);
    } catch (error) {
      // Error handling
      document.body.innerHTML = `<div class='error-fetching'><p>⚠ Oops! Something went wrong while loading the products.</p><p>Please refresh the page or try again later.</p></div>`; // [2, 5]
      return;
    }
  }

  // Once 'extensions' contains the final PURE state (whether from localStorage or fetch):
  renderCards();
  // We save the initial state with IDs for future reloads (only if it wasn't in localStorage)
  if (!storedData) {
    syncExtensionsToLocalStorage();
  }
};

const loadThemeFromLocalStorage = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("darkmode");
  }
};

// DOM CREATION & RENDERING

const createCardElement = (item) => {
  const cardTemplate = cloneTemplate("card-template");
  const card = cardTemplate.querySelector(".card");
  card.querySelector(".card-text h3").textContent = item.name;
  card.querySelector(".card-text p").textContent = item.description;
  card.querySelector(".card-content img").src = item.logo;
  card.dataset.id = item.id;
  if (item.isActive) {
    card.classList.add("enable");
    const toggle = card.querySelector(".card-toggle");
    toggle.checked = true;
  }
  card.querySelector("button").addEventListener("click", removeCard);

  return card;
};

const renderCards = () => {
  extensions.forEach((item) => {
    const cardElement = createCardElement(item);
    cardsContainer.appendChild(cardElement);
  });
};

const removeCard = (e) => {
  const card = e.target.closest("[data-id]");
  const itemId = card.dataset.id;

  card.classList.add("removing");

  // wait for animation to finish
  card.addEventListener(
    "transitionend",
    () => {
      //Remove the physical DOM element
      card.remove();
      //Update the JavaScript state (the 'extensions' array)
      extensions = extensions.filter((e) => e.id !== itemId);

      syncExtensionsToLocalStorage();
    },
    { once: true }
  );
};

// EVENT HANDLERS

// Toggle enable/disable card
cardsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("card-toggle")) {
    const card = e.target.closest(".card");
    const itemId = card.dataset.id;
    const isEnabled = e.target.checked;
    // Toggle the visible card
    card.classList.toggle("enable", isEnabled);
    // Update the PURE state
    const index = extensions.findIndex((item) => item.id === itemId);
    if (index !== -1) {
      extensions[index].isActive = isEnabled;
    }

    syncExtensionsToLocalStorage();
  }
});

// Changing Light/Dark mode
document.querySelector(".btn-theme").addEventListener("click", () => {
  document.startViewTransition(() => {
    document.body.classList.toggle("darkmode");

    if (document.body.classList.contains("darkmode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
});

// Filter helper functions
const updateActiveButton = (newBtn) => {
  filter.querySelector(".active").classList.remove("active");
  newBtn.classList.add("active");
};

const filterCards = (filterText, cards) => {
  cards.forEach((card) => {
    let show = false;
    if (filterText === "all") show = true;
    if (filterText === "enable" && card.classList.contains("enable"))
      show = true;
    if (filterText === "disable" && !card.classList.contains("enable"))
      show = true;

    card.classList.toggle("isHidden", !show);
  });
};

// Filter buttons
filterButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const cards = cardsContainer.querySelectorAll(".card");
    updateActiveButton(e.target);
    filterCards(e.target.dataset.filter, cards);
  });
});

// INITIALIZATION
loadThemeFromLocalStorage();
loadExtensions();
