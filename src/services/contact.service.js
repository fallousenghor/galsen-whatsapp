const BASE_URL = "https://backend-js-server-vrai.onrender.com/contacts";
// const BASE_URL = "http://localhost:3000/contacts";

async function fetchData(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  return await response.json();
}

function getCurrentUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?.id) throw new Error("Utilisateur non connecté");
  return user;
}

function validateContactData(contactData) {
  if (!contactData?.prenom || !contactData?.nom || !contactData?.telephone) {
    throw new Error("Données de contact incomplètes");
  }
}

export async function ajouterContact(contactData) {
  try {
    const user = getCurrentUser();
    validateContactData(contactData);

    const existingContacts = await getContactsByUserId(user.id);
    if (existingContacts.some((c) => c.telephone === contactData.telephone)) {
      throw new Error("Ce contact existe déjà");
    }

    const contact = {
      prenom: contactData.prenom,
      nom: contactData.nom,
      telephone: contactData.telephone,
      userId: user.id,
      sync: contactData.sync ?? true,
      createdAt: new Date().toISOString(),
      blocked: false,
    };

    return await fetchData(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
  } catch (error) {
    console.error("Erreur création contact:", error);
    throw error;
  }
}

export async function getContactsByUserId(userId) {
  try {
    const contacts = await fetchData(`${BASE_URL}?userId=${userId}`);
    return contacts.filter((contact) => !contact.blocked);
  } catch (error) {
    console.error("Erreur:", error);
    throw error;
  }
}

export async function getContacts(userId = null) {
  try {
    if (userId) {
      return await fetchData(`${BASE_URL}?userId=${userId}`);
    }
    
    // Si pas d'userId spécifié, récupérer tous les contacts de l'utilisateur connecté
    const currentUser = getCurrentUser();
    return await fetchData(`${BASE_URL}?userId=${currentUser.id}`);
  } catch (error) {
    console.error("Erreur récupération contacts:", error);
    throw error;
  }
}

export async function getContactById(id) {
  return await fetchData(`${BASE_URL}/${id}`);
}

export async function blockContact(id) {
  return await fetchData(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocked: true }),
  });
}

export async function getBlockedContacts() {
  return await fetchData(`${BASE_URL}?blocked=true`);
}

export async function unblockContact(contactId) {
  return await fetchData(`${BASE_URL}/${contactId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocked: false }),
  });
}

export async function searchContacts(userId, searchTerm) {
  return await fetchData(
    `${BASE_URL}?userId=${userId}&q=${encodeURIComponent(searchTerm)}`
  );
}