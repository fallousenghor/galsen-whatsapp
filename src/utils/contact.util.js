export const SELECTORS = {
  contactsList: "#contacts-list",
  contactForm: "#contact-form",
  blockedContactsList: "#blocked-contacts-list",
  addContactBtn: "#addContactBtn",
  firstName: "#firstName",
  lastName: "#lastName",
  selectIndicatif: "select",
  inputNumero: 'input[type="tel"]',
  toggleSwitch: "#toggleSwitch",
};

export function verifyRequiredElements(selectors) {
  const elements = {};
  const missingElements = [];

  for (const [key, selector] of Object.entries(selectors)) {
    elements[key] = document.querySelector(selector);
    if (!elements[key]) missingElements.push(key);
  }

  if (missingElements.length) {
    console.warn("Éléments manquants dans le DOM:", missingElements.join(", "));
    return null;
  }

  return elements;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr)
    throw new Error("Vous devez être connecté pour ajouter un contact");

  try {
    const user = JSON.parse(userStr);
    if (!user?.id) {
      localStorage.removeItem("user");
      throw new Error("Session invalide, veuillez vous reconnecter");
    }
    return user;
  } catch (e) {
    localStorage.removeItem("user");
    throw new Error("Session invalide, veuillez vous reconnecter");
  }
}

export function validateContactFormData({ prenom, nom, numero }) {
  if (!prenom || !nom || !numero) {
    throw new Error("Veuillez remplir tous les champs obligatoires");
  }

  if (!/^\d{6,}$/.test(numero)) {
    throw new Error("Le numéro de téléphone n'est pas valide");
  }
}

export function resetContactForm(formElements, syncState = true) {
  const { firstName, lastName, inputNumero, selectIndicatif, toggleSwitch } =
    formElements;

  firstName.value = "";
  lastName.value = "";
  inputNumero.value = "";
  selectIndicatif.selectedIndex = 0;

  if (toggleSwitch.classList.contains("bg-gray-600") && !syncState) {
    toggleSwitch.click();
  }
}
