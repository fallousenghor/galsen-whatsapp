import {
  sortContactsAlphabetically,
  filterContacts,
  handleContactSearch,
} from "../utils/search.utils.js";
import { getContactsByUserId } from "../services/contact.service.js";
import { setCurrentConversation } from "./message.controller.js";
import { loadView } from "../router.js";
import { setupAccueilEvents } from "./whatsapp.controller.js";
import { notifications } from "../utils/notifications.js";

export async function setupNouvelleDiscussionEvents() {
  const contactsContainer = document.getElementById("contacts-list");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const searchInput = document.querySelector(
    "#nouvelleDiscussion input[type='text']"
  );

  if (!currentUser?.id || !contactsContainer || !searchInput) return;

  let allContacts = [];

  try {
    allContacts = await getContactsByUserId(currentUser.id);

    const renderContacts = (contacts) => {
      const nonBlockedContacts = contacts.filter((contact) => !contact.blocked);

      contactsContainer.innerHTML = nonBlockedContacts
        .map(
          (contact) => `
          <div class="contact-item flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-800 transition-colors duration-200"
               data-contact-id="${contact.id}">
            <div class="flex items-center">
              <div class="w-12 h-12 rounded-full bg-black flex-shrink-0 mr-3 overflow-hidden">
                <div class="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex justify-center items-center font-bold text-white">
                  ${contact.prenom.charAt(0).toUpperCase()}${contact.nom
            .charAt(0)
            .toUpperCase()}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-base font-medium">${contact.prenom} ${
            contact.nom
          }</div>
                <div class="text-gray-400 text-sm">${contact.telephone}</div>
              </div>
            </div>
            <div class="text-gray-500">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        `
        )
        .join("");

      attachContactListeners();
    };

    const attachContactListeners = () => {
      document.querySelectorAll(".contact-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const contactId = item.dataset.contactId;
          const contact = allContacts.find((c) => c.id === contactId);
          if (contact) {
            try {
              // Retourner à la vue principale
              await loadView("/views/pages/whatsap.views.html", setupAccueilEvents);
              
              // Attendre que la vue soit chargée puis configurer la conversation
              setTimeout(async () => {
                await setCurrentConversation(
                  'contact', 
                  contact.id, 
                  `${contact.prenom} ${contact.nom}`
                );
                notifications.success(`Conversation avec ${contact.prenom} ${contact.nom} ouverte`);
              }, 200);
            } catch (error) {
              console.error('Erreur ouverture conversation:', error);
              notifications.error('Erreur lors de l\'ouverture de la conversation');
            }
          }
        });
      });
    };

    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.trim();
      handleContactSearch(searchTerm, allContacts, renderContacts);
    });

    renderContacts(allContacts);
  } catch (error) {
    console.error("Erreur lors du chargement des contacts:", error);
    contactsContainer.innerHTML = `
      <div class="text-red-500 p-4 text-center">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>Une erreur est survenue lors du chargement des contacts.</p>
        <button class="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onclick="location.reload()">
          Réessayer
        </button>
      </div>
    `;
  }
}