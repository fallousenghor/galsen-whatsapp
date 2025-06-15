import { setupContactEvents } from "./controllers/contact.controller.js";

function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  console.log("Current user:", user); // Debug
  return user && user.id;
}

export function loadView(viewPath, callback) {
  // Protection des routes nécessitant une authentification
  const protectedRoutes = [
    "nouvelle.discussion.html",
    "newContact.view.html",
    "contacts.views.html",
  ];

  if (
    protectedRoutes.some((route) => viewPath.includes(route)) &&
    !checkAuth()
  ) {
    alert("Vous devez être connecté pour accéder à cette page");
    window.location.href = "/views/pages/login.views.html";
    return;
  }

  fetch(viewPath)
    .then((response) => response.text())
    .then((html) => {
      const app = document.getElementById("app");
      if (!app) {
        console.error("Conteneur #app introuvable.");
        return;
      }
      app.innerHTML = html;

      // Initialisation des événements selon la vue
      if (viewPath.includes("newContact.view.html")) {
        setupContactEvents();
      }

      if (callback) callback();
    })
    .catch((error) => {
      console.error("Erreur lors du chargement de la vue :", error);
    });
}

export function redirectTo(viewPath, callback) {
  loadView(viewPath, callback);
}
