import "./style.css";
import { loadView } from "./router.js";
import {
  setupPanelEvents,
  setupAccueilEvents,
  setupContactSelection,
} from "./controllers/whatsapp.controller.js";

let user = null;
try {
  user = JSON.parse(localStorage.getItem("user"));
} catch (error) {
  console.error(
    "Erreur lors de la récupération des données utilisateur :",
    error
  );
}

const checkViewExists = async (viewPath) => {
  try {
    const response = await fetch(viewPath, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.error(
      `Erreur lors de la vérification de la vue ${viewPath} :`,
      error
    );
    return false;
  }
};

const loadRegisterView = async () => {
  try {
    const module = await import("./controllers/user.controller.js");
    module.setupFormEvents();
  } catch (error) {
    console.error("Erreur chargement du contrôleur register :", error);
  }
};

const loadWhatsAppView = () => {
  setupPanelEvents();
};

document.addEventListener("DOMContentLoaded", async () => {
  setupPanelEvents();
  setupAccueilEvents();
  setupContactSelection();

  if (!user) {
    const viewExists = await checkViewExists(
      "/views/pages/register.views.html"
    );
    if (viewExists) {
      loadView("/views/pages/register.views.html", loadRegisterView);
    } else {
      console.error("La vue d'inscription est introuvable.");
    }
  } else {
    loadView("/views/pages/whatsap.views.html", loadWhatsAppView);
  }
});