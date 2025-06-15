import { getContactsByUserId } from "../services/contact.service.js";
import { createGroupe } from "../services/groupe.service.js";
import { displayUserContacts } from "../utils/contacts.display.js";
import { notifications } from "../utils/notifications.js";

export async function setupGroupeEvents() {
  const contactsList = document.getElementById("contacts-list");
  const groupNameInput = document.getElementById("groupName");
  const createGroupBtn = document.getElementById("createGroupBtn");
  const selectedContacts = new Set();

  if (!contactsList || !groupNameInput || !createGroupBtn) {
    console.error("Éléments DOM manquants");
    return;
  }

  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      throw new Error("Utilisateur non connecté");
    }

    const user = JSON.parse(userStr);
    if (!user?.id) {
      throw new Error("Session utilisateur invalide");
    }

    const contacts = await getContactsByUserId(user.id);
    displayContacts(contacts);

    contactsList.addEventListener("click", (e) => {
      const contactItem = e.target.closest(".contact-item");
      if (!contactItem) return;

      const contactId = contactItem.dataset.contactId;
      if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
        contactItem.classList.remove("selected", "bg-gray-700");
      } else {
        selectedContacts.add(contactId);
        contactItem.classList.add("selected", "bg-gray-700");
      }

      createGroupBtn.disabled = selectedContacts.size < 2;
      createGroupBtn.classList.toggle("opacity-50", selectedContacts.size < 2);
    });

    createGroupBtn.addEventListener("click", async () => {
      try {
        const groupName = groupNameInput.value.trim();
        if (!groupName) {
          notifications.warning("Veuillez donner un nom au groupe");
          return;
        }

        if (selectedContacts.size < 2) {
          notifications.warning("Veuillez sélectionner au moins 2 contacts");
          return;
        }

        const newGroupe = {
          nom: groupName,
          adminId: user.id,
          membres: Array.from(selectedContacts),
          createdAt: new Date().toISOString(),
        };

        const createdGroupe = await createGroupe(newGroupe);

        if (createdGroupe) {
          notifications.success("Groupe créé avec succès!");
          setTimeout(() => {
            window.location.href = "/whatsap.views.html";
          }, 1500);
        } else {
          throw new Error("Erreur lors de la création du groupe");
        }
      } catch (error) {
        notifications.error(error.message || "Erreur lors de la création du groupe");
        console.error("Erreur création groupe:", error);
      }
    });
  } catch (error) {
    console.error("Erreur initialisation:", error);
    contactsList.innerHTML = `
      <div class="text-red-500 p-4 text-center">
        ${
          error.message ||
          "Une erreur est survenue lors du chargement des contacts"
        }
      </div>
    `;
  }
}

function displayContacts(contacts) {
  const contactsList = document.getElementById("contacts-list");
  if (!contactsList) return;

  contactsList.innerHTML = contacts
    .map(
      (contact) => `
    <div class="contact-item px-4 py-3 flex items-center space-x-3 cursor-pointer hover:bg-gray-800" 
         data-contact-id="${contact.id}">
      <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-600">
        <div class="w-full h-full bg-gradient-to-br from-pink-400 to-blue-300 flex items-center justify-center">
          <span class="text-white text-sm font-medium">
            ${contact.prenom[0]}${contact.nom[0]}
          </span>
        </div>
      </div>
      <div class="flex-1">
        <div class="text-white font-medium">${contact.prenom} ${contact.nom}</div>
        <div class="text-gray-400 text-sm">${contact.telephone}</div>
      </div>
    </div>
  `
    )
    .join("");
}