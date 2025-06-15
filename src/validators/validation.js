// src/validation.js

export function validateRegisterForm(form) {
  const prenom = form.querySelector("#prenom");
  const nom = form.querySelector("#nom");
  const telephone = form.querySelector("#telephone");

  const prenomError = form.querySelector("#prenomError");
  const nomError = form.querySelector("#nomError");
  const telephoneError = form.querySelector("#telephoneError");

  let valid = true;

  // Réinitialiser tous les messages
  prenomError.textContent = "";
  nomError.textContent = "";
  telephoneError.textContent = "";

  // Valider prénom
  if (prenom.value.trim() === "") {
    prenomError.textContent = "Le prénom est requis.";
    valid = false;
  } else if (prenom.value.trim().length < 2) {
    prenomError.textContent = "Le prénom doit contenir au moins 2 caractères.";
    valid = false;
  }

  // Valider nom
  if (nom.value.trim() === "") {
    nomError.textContent = "Le nom est requis.";
    valid = false;
  } else if (nom.value.trim().length < 2) {
    nomError.textContent = "Le nom doit contenir au moins 2 caractères.";
    valid = false;
  }

  // Valider téléphone
  const phoneRegex = /^[0-9]{8,15}$/; // Ajusté pour correspondre à la validation d'inscription
  if (!phoneRegex.test(telephone.value.trim())) {
    telephoneError.textContent = "Le numéro de téléphone est invalide.";
    valid = false;
  }

  return valid;
}

export function validateLoginForm(form) {
  const countryCode = form.querySelector("#countryCode").value;
  const telephone = form.querySelector("#telephone").value.trim();

  const phoneRegex = /^[0-9]{6,}$/;

  if (!telephone) {
    alert("Veuillez entrer votre numéro de téléphone.");
    return false;
  }

  if (!phoneRegex.test(telephone)) {
    alert("Le numéro de téléphone est invalide.");
    return false;
  }

  if (!countryCode) {
    alert("Veuillez sélectionner un indicatif.");
    return false;
  }

  return true;
}
