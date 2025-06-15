export function validatePhoneNumber(phoneNumber) {
  const phoneRegex = /^[0-9]{8,15}$/; // Numéros de 8 à 15 chiffres
  if (!phoneRegex.test(phoneNumber)) {
    return "Le numéro de téléphone doit contenir entre 8 et 15 chiffres.";
  }
  return null; // Aucun problème
}
