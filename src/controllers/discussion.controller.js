import { getUserConversations } from "../services/message.service.js";
import { getContactById } from "../services/contact.service.js";
import { getGroupeById } from "../services/groupe.service.js";
import { setCurrentConversation } from "./message.controller.js";

let allDiscussions = [];
let currentFilter = 'all';
let isLoadingDiscussions = false;
let discussionPollingInterval = null;

export async function setupDiscussionEvents() {
  await loadDiscussions();
  setupFilterTabs();
  setupSearchFilter();
}

async function loadDiscussions() {
  if (isLoadingDiscussions) {
    console.log('Chargement des discussions déjà en cours...');
    return;
  }

  isLoadingDiscussions = true;

  try {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?.id) {
      displayEmptyState();
      return;
    }

    const conversations = await getUserConversations(currentUser.id);
    
    if (conversations.length === 0) {
      allDiscussions = [];
      displayEmptyState();
      return;
    }
    
    const enrichedConversations = await Promise.allSettled(
      conversations.map(async (conv) => {
        try {
          if (conv.isGroup) {
            const group = await getGroupeById(conv.id);
            return {
              ...conv,
              name: group?.nom || 'Groupe inconnu',
              type: 'group',
              avatar: 'G',
              isFavorite: conv.isFavorite || false
            };
          } else {
            const contact = await getContactById(conv.id);
            return {
              ...conv,
              name: contact ? `${contact.prenom} ${contact.nom}` : 'Contact inconnu',
              type: 'contact',
              avatar: contact ? `${contact.prenom[0]}${contact.nom[0]}` : 'C',
              phone: contact?.telephone,
              isFavorite: conv.isFavorite || false
            };
          }
        } catch (error) {
          console.error('Erreur enrichissement conversation:', error);
          return {
            ...conv,
            name: 'Inconnu',
            type: conv.isGroup ? 'group' : 'contact',
            avatar: 'U',
            isFavorite: false
          };
        }
      })
    );

    allDiscussions = enrichedConversations
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    displayDiscussions(getFilteredDiscussions());
    
  } catch (error) {
    console.error('Erreur chargement discussions:', error);
    displayEmptyState();
  } finally {
    isLoadingDiscussions = false;
  }
}

function getFilteredDiscussions() {
  switch (currentFilter) {
    case 'unread':
      return allDiscussions.filter(d => d.unreadCount > 0);
    case 'favorites':
      return allDiscussions.filter(d => d.isFavorite);
    case 'groups':
      return allDiscussions.filter(d => d.isGroup);
    default:
      return allDiscussions;
  }
}

function displayEmptyState() {
  const discussionsContainer = document.getElementById('discussions-list');
  if (!discussionsContainer) return;

  discussionsContainer.innerHTML = `
    <div class="text-center p-8 text-gray-400">
      <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-comments text-4xl"></i>
      </div>
      <p class="text-lg font-medium">Aucune discussion</p>
      <p class="text-sm mt-2">Commencez une nouvelle conversation</p>
    </div>
  `;
}

function displayDiscussions(discussions) {
  const discussionsContainer = document.getElementById('discussions-list');
  if (!discussionsContainer) return;

  if (discussions.length === 0) {
    const emptyMessage = currentFilter === 'all' 
      ? 'Aucune discussion trouvée'
      : `Aucune discussion ${getFilterLabel(currentFilter)}`;
    
    discussionsContainer.innerHTML = `
      <div class="text-center p-8 text-gray-400">
        <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-comments text-4xl"></i>
        </div>
        <p class="text-lg font-medium">${emptyMessage}</p>
        <p class="text-sm mt-2">Commencez une nouvelle conversation</p>
      </div>
    `;
    return;
  }

  const discussionsHTML = discussions.map(discussion => {
    const lastMessageTime = new Date(discussion.lastMessage.timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const lastMessagePreview = discussion.lastMessage.content.length > 30 
      ? discussion.lastMessage.content.substring(0, 30) + '...'
      : discussion.lastMessage.content;

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isOwnMessage = discussion.lastMessage.senderId === currentUser.id;
    
    return `
      <div class="discussion-item p-4 hover:bg-gray-700 cursor-pointer border-l-4 ${
        discussion.unreadCount > 0 ? 'border-green-500 bg-gray-750' : 'border-transparent'
      } transition-all duration-200" 
           data-discussion-id="${discussion.id}" 
           data-discussion-type="${discussion.type}"
           data-discussion-name="${discussion.name}">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <div class="avatar ${discussion.isGroup ? 'bg-green-500' : 'bg-blue-500'} w-12 h-12 text-sm font-bold">
              ${discussion.avatar}
            </div>
            ${discussion.unreadCount > 0 ? `
              <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold shadow-lg notification-badge">
                ${discussion.unreadCount > 99 ? '99+' : discussion.unreadCount}
              </span>
            ` : ''}
            ${discussion.isFavorite ? `
              <span class="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full w-4 h-4 flex items-center justify-center">
                <i class="fas fa-star text-white text-xs"></i>
              </span>
            ` : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <h3 class="font-medium text-white truncate">${discussion.name}</h3>
              <span class="text-xs text-gray-400 flex-shrink-0 ml-2">${lastMessageTime}</span>
            </div>
            <div class="flex items-center mt-1">
              ${isOwnMessage ? `
                ${getMessageStatusIcon(discussion.lastMessage.status)}
              ` : ''}
              <p class="text-sm text-gray-400 truncate ${discussion.unreadCount > 0 ? 'font-medium text-white' : ''}">
                ${lastMessagePreview}
              </p>
            </div>
            ${discussion.phone ? `
              <p class="text-xs text-gray-500 mt-1">${discussion.phone}</p>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  discussionsContainer.innerHTML = discussionsHTML;

  document.querySelectorAll('.discussion-item').forEach(item => {
    item.addEventListener('click', async () => {
      const discussionId = item.dataset.discussionId;
      const discussionType = item.dataset.discussionType;
      const discussionName = item.dataset.discussionName;

      document.querySelectorAll('.discussion-item').forEach(i => 
        i.classList.remove('border-green-500', 'bg-gray-750')
      );
      item.classList.add('border-green-500', 'bg-gray-750');

      try {
        await setCurrentConversation(discussionType, discussionId, discussionName);

        // Supprimer le badge de messages non lus
        const unreadBadge = item.querySelector('.notification-badge');
        if (unreadBadge) {
          unreadBadge.remove();
        }

        // Mettre à jour le style du texte
        const messageText = item.querySelector('.text-gray-400');
        if (messageText) {
          messageText.classList.remove('font-medium', 'text-white');
          messageText.classList.add('text-gray-400');
        }

        // Recharger les discussions pour mettre à jour les compteurs
        setTimeout(() => {
          loadDiscussions();
        }, 1000);

      } catch (error) {
        console.error('Erreur ouverture conversation:', error);
      }
    });
  });
}

function getFilterLabel(filter) {
  switch (filter) {
    case 'unread': return 'non lue';
    case 'favorites': return 'favorite';
    case 'groups': return 'de groupe';
    default: return '';
  }
}

function getMessageStatusIcon(status) {
  switch (status) {
    case 'sent':
      return '<i class="fas fa-check text-gray-400 mr-1 flex-shrink-0" title="Envoyé"></i>';
    case 'delivered':
      return '<i class="fas fa-check-double text-gray-400 mr-1 flex-shrink-0" title="Livré"></i>';
    case 'read':
      return '<i class="fas fa-check-double text-blue-400 mr-1 flex-shrink-0" title="Lu"></i>';
    default:
      return '<i class="fas fa-clock text-gray-400 mr-1 flex-shrink-0" title="En cours"></i>';
  }
}

function setupFilterTabs() {
  const tabs = {
    'tab-all': 'all',
    'tab-unread': 'unread', 
    'tab-favorites': 'favorites',
    'tab-groups': 'groups'
  };

  Object.entries(tabs).forEach(([tabId, filterType]) => {
    const tab = document.getElementById(tabId);
    if (tab) {
      tab.addEventListener('click', () => {
        Object.keys(tabs).forEach(id => {
          const tabElement = document.getElementById(id);
          if (tabElement) {
            tabElement.classList.remove('text-green-500', 'border-b-2', 'border-green-500', 'font-medium');
            tabElement.classList.add('text-gray-400', 'hover:text-white');
          }
        });

        tab.classList.remove('text-gray-400', 'hover:text-white');
        tab.classList.add('text-green-500', 'border-b-2', 'border-green-500', 'font-medium');

        currentFilter = filterType;
        
        if (filterType === 'groups') {
          document.getElementById('discussions-list').classList.add('hidden');
          document.getElementById('groupes-list').classList.remove('hidden');
          if (window.displayGroupes) {
            window.displayGroupes();
          }
        } else {
          document.getElementById('discussions-list').classList.remove('hidden');
          document.getElementById('groupes-list').classList.add('hidden');
          displayDiscussions(getFilteredDiscussions());
        }
      });
    }
  });
}

function setupSearchFilter() {
  const searchInput = document.querySelector('input[placeholder="Rechercher ou démarrer une discussion"]');
  if (searchInput) {
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
          displayDiscussions(getFilteredDiscussions());
          return;
        }

        const filteredDiscussions = getFilteredDiscussions().filter(discussion => 
          discussion.name.toLowerCase().includes(searchTerm) ||
          discussion.lastMessage.content.toLowerCase().includes(searchTerm) ||
          (discussion.phone && discussion.phone.includes(searchTerm))
        );

        displayDiscussions(filteredDiscussions);
      }, 300);
    });
  }
}

export function startDiscussionPolling() {
  if (discussionPollingInterval) {
    clearInterval(discussionPollingInterval);
  }
  
  discussionPollingInterval = setInterval(async () => {
    if (!isLoadingDiscussions) {
      try {
        await loadDiscussions();
      } catch (error) {
        console.warn('Erreur polling discussions:', error);
      }
    }
  }, 10000);
}

export function stopDiscussionPolling() {
  if (discussionPollingInterval) {
    clearInterval(discussionPollingInterval);
    discussionPollingInterval = null;
  }
}

export async function refreshDiscussions() {
  if (!isLoadingDiscussions) {
    await loadDiscussions();
  }
}