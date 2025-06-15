import { setupContactEvents } from "./contact.controller.js";
import { setupNouvelleDiscussionEvents } from "./nouvelle.discussion.controller.js";
import { setupGroupeEvents } from "./groupe.controller.js";
import { setupMessageEvents, setCurrentConversation } from "./message.controller.js";
import { setupDiscussionEvents, startDiscussionPolling } from "./discussion.controller.js";
import {
  getContacts,
  getContactById,
  blockContact,
  getBlockedContacts,
  unblockContact,
} from "../services/contact.service.js";
import {
  getGroupesByUserId,
  updateGroupe,
  getGroupeById,
} from "../services/groupe.service.js";
import { updateContactsList } from "../utils/utils.js";
import { templates } from "../../public/views/components/template.js";
import { ModalManager } from "../utils/modal.js";

let selectedContactId = null;

async function loadTemplate(url, panelId = "panel", setupFunction = null) {
  try {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const response = await fetch(url);
    const html = await response.text();
    panel.innerHTML = html;

    if (setupFunction) {
      requestAnimationFrame(() => {
        setupFunction();
      });
    }
  } catch (error) {
    console.error(`Erreur de chargement (${url}):`, error);
    showError("Erreur lors du chargement de la page");
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

async function showContactInfo(contact) {
  const modal = document.createElement("div");
  modal.innerHTML = templates.contactInfo(contact);
  document.body.appendChild(modal);

  modal.querySelector(".close-btn").addEventListener("click", () => {
    modal.remove();
  });

  // Fermer en cliquant à l'extérieur
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

async function updateBlockedContactsCounter() {
  try {
    const blockedContacts = await getBlockedContacts();
    const nombreBloquer = document.getElementById("nombreBloquer");
    if (nombreBloquer) {
      nombreBloquer.textContent = blockedContacts.length;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du compteur:", error);
  }
}

async function displayGroupes() {
  const groupesList = document.getElementById("groupes-list");
  if (!groupesList) {
    console.error("Element groupes-list non trouvé");
    return;
  }

  groupesList.innerHTML = `
    <div class="text-center p-8 text-gray-400">
      <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-spinner fa-spin text-4xl"></i>
      </div>
      <p class="text-lg font-medium">Chargement des groupes...</p>
    </div>
  `;

  try {
    const currentUser = JSON.parse(localStorage.getItem("user"));

    if (!currentUser?.id) {
      throw new Error("Utilisateur non connecté");
    }

    const groupes = await getGroupesByUserId(currentUser.id);
    const activeGroupes = groupes.filter((g) => !g.closed);

    if (activeGroupes.length === 0) {
      groupesList.innerHTML = `
        <div class="text-center p-8 text-gray-400">
          <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-users text-4xl"></i>
          </div>
          <p class="text-lg font-medium">Aucun groupe trouvé</p>
          <p class="text-sm mt-2">Créez votre premier groupe pour commencer</p>
          <button 
            class="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            onclick="document.getElementById('newgroup').click()"
          >
            Créer un groupe
          </button>
        </div>
      `;
      return;
    }

    groupesList.innerHTML = activeGroupes
      .map(
        (groupe) => `
        <div class="groupe-item p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-600 transition-colors" data-group-id="${groupe.id}">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <i class="fas fa-users text-white"></i>
              </div>
              <div>
                <h3 class="text-white font-medium">${groupe.nom}</h3>
                <p class="text-gray-400 text-sm">
                  ${groupe.membres ? groupe.membres.length : 0} membres
                  ${
                    groupe.admins && groupe.admins.length > 1
                      ? ` • ${groupe.admins.length} admins`
                      : ""
                  }
                </p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
                onclick="showGroupOptions('${groupe.id}')"
                title="Options du groupe"
              >
                <i class="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>
          
          <div id="group-options-${groupe.id}" class="hidden mt-3 bg-gray-800 rounded-lg p-2 space-y-1">
            <button 
              class="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
              onclick="showAddMemberModal('${groupe.id}')"
            >
              <i class="fas fa-user-plus"></i>
              <span>Ajouter des membres</span>
            </button>
            <button 
              class="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
              onclick="showRemoveMemberModal('${groupe.id}')"
            >
              <i class="fas fa-user-minus"></i>
              <span>Retirer des membres</span>
            </button>
            <button 
              class="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
              onclick="showManageAdminsModal('${groupe.id}')"
            >
              <i class="fas fa-crown"></i>
              <span>Gérer les admins</span>
            </button>
            <button 
              class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded flex items-center space-x-2 transition-colors"
              onclick="closeGroup('${groupe.id}')"
            >
              <i class="fas fa-times-circle"></i>
              <span>Fermer le groupe</span>
            </button>
          </div>
        </div>
      `
      )
      .join("");

    // Ajouter les événements de clic pour les groupes
    document.querySelectorAll('.groupe-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.closest('button')) return;
        
        const groupId = item.dataset.groupId;
        try {
          const groupe = await getGroupeById(groupId);
          if (groupe) {
            await setCurrentConversation('group', groupe.id, groupe.nom);
            
            document.querySelectorAll('.groupe-item').forEach(i => 
              i.classList.remove('border-green-500', 'bg-gray-750')
            );
            item.classList.add('border-green-500', 'bg-gray-750');
          }
        } catch (error) {
          console.error('Erreur ouverture groupe:', error);
          showError('Erreur lors de l\'ouverture du groupe');
        }
      });
    });

  } catch (error) {
    console.error("Erreur lors du chargement des groupes:", error);
    groupesList.innerHTML = `
      <div class="text-center p-8 text-red-400">
        <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-4xl"></i>
        </div>
        <p class="text-lg font-medium">Erreur lors du chargement des groupes</p>
        <p class="text-sm mt-2">${error.message}</p>
        <button 
          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onclick="displayGroupes()"
        >
          Réessayer
        </button>
      </div>
    `;
  }
}

export async function setupPanelEvents() {
  document.addEventListener("click", async (event) => {
    const buttonHandlers = {
      "#plus": "/views/pages/nouvelle.discussion.html",
      "#retourbtn": "/views/pages/nouvelle.discussion.html",
      "#newContact": "/views/pages/newContact.view.html",
      "#backnewgroupe": "/views/pages/nouvelle.discussion.html",
      "#paramsBtn": "/views/components/params.html",
      "#confback": "/views/components/params.html",
      "#blockback": "/views/components/bloquerListe.html",
      "#contactBlocked": "/views/components/bloquerListe.html",
      "#newgroup": "/views/pages/nouveau.groupe.html",
      "#listedescontactbloquer": "/views/components/listecontactbloquer.html",
    };

    for (const [selector, url] of Object.entries(buttonHandlers)) {
      if (event.target.closest(selector)) {
        let setupFn;
        if (selector === "#plus" || selector === "#retourbtn") {
          setupFn = setupNouvelleDiscussionEvents;
        } else if (selector === "#newgroup") {
          setupFn = setupGroupeEvents;
        } else if (selector === "#listedescontactbloquer") {
          setupFn = displayBlockedContacts;
        } else if (selector === "#contactBlocked") {
          setupFn = async () => {
            await displayBlockedContacts();
            await updateBlockedContactsCounter();
          };
        } else {
          setupFn = setupContactEvents;
        }

        await loadTemplate(url, "panel", setupFn);
        return;
      }
    }

    // Gestion du popup menu
    const menupopup = event.target.closest("#menupopup");
    if (menupopup) {
      try {
        const response = await fetch("/views/components/popup.html");
        const html = await response.text();
        
        // Créer ou mettre à jour le popup
        let popupOverlay = document.getElementById('popup-overlay');
        if (!popupOverlay) {
          document.body.insertAdjacentHTML('beforeend', html);
          popupOverlay = document.getElementById('popup-overlay');
        }
        
        popupOverlay.style.display = 'flex';

        // Gestion des événements du popup
        popupOverlay.querySelector(".info-btn")?.addEventListener("click", async () => {
          if (!selectedContactId) {
            showError("Veuillez sélectionner un contact");
            return;
          }
          try {
            const contact = await getContactById(selectedContactId);
            showContactInfo(contact);
            popupOverlay.style.display = 'none';
          } catch (error) {
            showError("Erreur lors de la récupération des informations");
            console.error(error);
          }
        });

        popupOverlay.querySelector(".block-btn")?.addEventListener("click", async () => {
          if (!selectedContactId) {
            showError("Veuillez sélectionner un contact");
            return;
          }
          
          ModalManager.confirm(
            "Êtes-vous sûr de vouloir bloquer ce contact ?",
            async () => {
              try {
                await blockContact(selectedContactId);
                const contactElement = document.querySelector(
                  `[data-contact-id="${selectedContactId}"]`
                );
                if (contactElement) contactElement.remove();

                await updateBlockedContactsCounter();
                showSuccess("Contact bloqué avec succès");
                popupOverlay.style.display = 'none';
              } catch (error) {
                showError("Erreur lors du blocage du contact");
                console.error(error);
              }
            }
          );
        });
      } catch (error) {
        console.error("Erreur lors du chargement du popup:", error);
        showError("Erreur lors du chargement du menu");
      }
    }

    // Fermer le popup si on clique ailleurs
    if (event.target.id === 'popup-overlay') {
      event.target.style.display = 'none';
    }
  });
}

export function setupAccueilEvents() {
  console.log('Configuration des événements d\'accueil');
  
  setupMessageEvents();
  setupDiscussionEvents();
  startDiscussionPolling();
  setupContactSelection();

  document.addEventListener("click", (event) => {
    if (event.target.closest("#logoutBtn")) {
      ModalManager.confirm(
        "Êtes-vous sûr de vouloir vous déconnecter ?",
        () => {
          localStorage.removeItem("user");
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
      );
    }
  });
}

export function setupContactSelection() {
  console.log('Configuration de la sélection de contacts');
  
  document.addEventListener("click", async (event) => {
    const discussionItem = event.target.closest(".discussion-item");
    if (discussionItem && !event.target.closest('button')) {
      const discussionId = discussionItem.dataset.discussionId;
      const discussionType = discussionItem.dataset.discussionType;
      const discussionName = discussionItem.dataset.discussionName;

      if (discussionId && discussionType && discussionName) {
        document.querySelectorAll(".discussion-item, .contact-item").forEach((item) => 
          item.classList.remove("selected", "border-green-500", "bg-gray-750")
        );
        
        discussionItem.classList.add("selected", "border-green-500", "bg-gray-750");
        selectedContactId = discussionId;

        try {
          await setCurrentConversation(discussionType, discussionId, discussionName);
        } catch (error) {
          console.error("Erreur:", error);
          showError("Erreur lors de l'ouverture de la conversation");
        }
      }
      return;
    }

    const contactItem = event.target.closest(".contact-item");
    if (contactItem && !event.target.closest('button')) {
      document.querySelectorAll(".contact-item, .discussion-item").forEach((item) => 
        item.classList.remove("selected", "border-green-500", "bg-gray-750")
      );
      
      contactItem.classList.add("selected", "border-green-500", "bg-gray-750");
      selectedContactId = contactItem.dataset.contactId;

      try {
        const contact = await getContactById(selectedContactId);
        if (contact) {
          await setCurrentConversation('contact', contact.id, `${contact.prenom} ${contact.nom}`);
        }
      } catch (error) {
        console.error("Erreur:", error);
        showError("Erreur lors de l'ouverture de la conversation");
      }
    }
  });
}

async function displayBlockedContacts() {
  const blockedContactsList = document.getElementById("blocked-contacts-list");
  if (!blockedContactsList) return;

  try {
    const blockedContacts = await getBlockedContacts();
    blockedContactsList.innerHTML = templates.blockedContactsList(blockedContacts);
    await updateBlockedContactsCounter();

    blockedContactsList.addEventListener("click", async (e) => {
      const unblockBtn = e.target.closest(".unblock-btn");
      if (!unblockBtn) return;

      const contactItem = unblockBtn.closest(".blocked-contact-item");
      const contactId = contactItem?.dataset.contactId;
      if (!contactId) return;

      ModalManager.confirm(
        "Êtes-vous sûr de vouloir débloquer ce contact ?",
        async () => {
          try {
            await unblockContact(contactId);
            contactItem.remove();

            const currentUser = JSON.parse(localStorage.getItem("user"));
            if (currentUser?.id) {
              const contacts = await getContacts(currentUser.id);
              updateContactsList(contacts);
            }

            if (blockedContactsList.children.length === 0) {
              blockedContactsList.innerHTML = templates.blockedContactsList([]);
            }

            await updateBlockedContactsCounter();
            showSuccess("Contact débloqué avec succès");
          } catch (error) {
            console.error("Erreur lors du déblocage:", error);
            showError("Erreur lors du déblocage du contact");
          }
        }
      );
    });
  } catch (error) {
    console.error("Erreur lors du chargement des contacts bloqués:", error);
    blockedContactsList.innerHTML = templates.blockedContactsError;
  }
}

// Rendre displayGroupes accessible globalement
window.displayGroupes = displayGroupes;

// Fonctions globales pour la gestion des groupes
window.showGroupOptions = (groupId) => {
  document.querySelectorAll('[id^="group-options-"]').forEach((menu) => {
    if (menu.id !== `group-options-${groupId}`) {
      menu.classList.add("hidden");
    }
  });

  const optionsMenu = document.getElementById(`group-options-${groupId}`);
  if (optionsMenu) {
    optionsMenu.classList.toggle("hidden");
  }
};

window.showAddMemberModal = async (groupId) => {
  try {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser?.id) {
      showError("Utilisateur non connecté");
      return;
    }

    const groupe = await getGroupeById(groupId);
    const allContacts = await getContacts(currentUser.id);

    if (!groupe) {
      showError("Groupe introuvable !");
      return;
    }

    const availableContacts = allContacts.filter(
      (contact) => !groupe.membres.includes(contact.id) && !contact.blocked
    );

    if (availableContacts.length === 0) {
      showError("Aucun contact disponible à ajouter");
      return;
    }

    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-medium">Ajouter des membres</h3>
          <button class="text-gray-400 hover:text-white transition-colors" onclick="this.closest('.fixed').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="space-y-2">
          ${availableContacts
            .map(
              (contact) => `
            <div class="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg transition-colors">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  ${contact.prenom[0]}${contact.nom[0]}
                </div>
                <div>
                  <div class="text-white text-sm font-medium">${contact.prenom} ${contact.nom}</div>
                  <div class="text-gray-400 text-xs">${contact.telephone}</div>
                </div>
              </div>
              <button 
                class="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-lg transition-colors"
                onclick="addMemberToGroup('${groupId}', '${contact.id}', this)"
              >
                Ajouter
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (error) {
    console.error("Erreur:", error);
    showError("Erreur lors du chargement des contacts");
  }
};

window.addMemberToGroup = async (groupId, memberId, buttonElement) => {
  try {
    const groupe = await getGroupeById(groupId);

    if (!groupe) {
      showError("Groupe introuvable !");
      return;
    }

    if (groupe.membres.includes(memberId)) {
      showError("Le membre est déjà dans le groupe !");
      return;
    }

    groupe.membres.push(memberId);
    await updateGroupe(groupe);

    buttonElement.textContent = "Ajouté";
    buttonElement.disabled = true;
    buttonElement.classList.remove("bg-green-600", "hover:bg-green-700");
    buttonElement.classList.add("bg-gray-500");

    setTimeout(() => {
      const modal = buttonElement.closest(".fixed");
      if (modal) modal.remove();
      displayGroupes();
    }, 1000);

    showSuccess("Membre ajouté avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre :", error);
    showError("Erreur lors de l'ajout du membre !");
  }
};