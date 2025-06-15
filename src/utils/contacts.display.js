import { getContactsByUserId } from "../services/contact.service.js";

export async function displayUserContacts() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) return;

    const contacts = await getContactsByUserId(user.id);
    const contactsContainer = document.getElementById("contactsContainer");

    if (!contactsContainer) return;

    contactsContainer.innerHTML = "";

    const userContactHtml = `
      <div class="flex items-center py-3 hover:bg-gray-700 cursor-pointer">
        <div class="w-12 h-12 rounded-full bg-slate-600 flex-shrink-0 mr-3 overflow-hidden">
          <div class="w-full h-full bg-gradient-to-br bg-slate-700 flex items-center justify-center text-white font-bold">
            ${user.prenom ? user.prenom.charAt(0) : ""}${
      user.nom ? user.nom.charAt(0) : ""
    }
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white text-base">${user.telephone} (vous)</div>
          <div class="text-gray-400 text-sm">Envoyez-vous un message</div>
        </div>
      </div>
      <div class="border-b border-gray-700 my-2"></div>
    `;
    contactsContainer.innerHTML += userContactHtml;

    contacts.forEach((contact) => {
      const contactHtml = `
        <div class="flex items-center py-3 hover:bg-gray-700 cursor-pointer">
          <div class="w-12 h-12 rounded-full bg-gray-600 flex-shrink-0 mr-3 overflow-hidden">
            <div class="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-blue-400 to-blue-600">
              ${contact.prenom.charAt(0)}${contact.nom.charAt(0)}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white text-base">${contact.prenom} ${
        contact.nom
      }</div>
            <div class="text-gray-400 text-sm">${contact.telephone}</div>
          </div>
        </div>
      `;
      contactsContainer.innerHTML += contactHtml;
    });
  } catch (error) {
    console.error("Erreur affichage contacts:", error);
  }
}

export function setupSearchAndDisplay(containerId, contacts) {
  const searchInput = document.querySelector(
    `#${containerId} input[type="text"]`
  );
  const contactsContainer = document.querySelector(
    `#${containerId} .contacts-list`
  );

  if (!searchInput || !contactsContainer) return;

  const displayFilteredContacts = (filteredContacts) => {
    contactsContainer.innerHTML = filteredContacts
      .map(
        (contact) => `
      <div class="contact-item flex items-center py-3 hover:bg-gray-700 cursor-pointer" data-contact-id="${contact.id}">
        <div class="avatar bg-slate-700 mr-3">
          ${contact.prenom[0]}${contact.nom[0]}
        </div>
        <div class="flex-1">
          <div class="text-white">${contact.prenom} ${contact.nom}</div>
          <div class="text-gray-400 text-sm">${contact.telephone}</div>
        </div>
      </div>
    `
      )
      .join("");
  };

  displayFilteredContacts(filterAndSortContacts(contacts, "*"));

  searchInput.addEventListener("input", (e) => {
    const filtered = filterAndSortContacts(contacts, e.target.value);
    displayFilteredContacts(filtered);
  });
}

// export default { displayUserContacts };
