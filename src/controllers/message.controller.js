import { 
  sendMessage, 
  getMessagesBetweenUsers, 
  getGroupMessages,
  markMessageAsRead,
  markConversationAsRead,
  clearMessageCache,
  preloadConversationMessages,
  getUnreadMessagesCount
} from "../services/message.service.js";
import { getContactById } from "../services/contact.service.js";
import { getGroupeById } from "../services/groupe.service.js";
import { refreshDiscussions } from "./discussion.controller.js";
import { createOrUpdateDiscussion } from "../services/discussion.service.js";

let currentConversation = null;
let messagePollingInterval = null;
let unreadCountInterval = null;
let isMessageSending = false;
let lastMessageId = null;
let messageQueue = [];
let isProcessingQueue = false;

export function setupMessageEvents() {
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');

  if (!messageInput || !sendButton) {
    console.error('Éléments de messagerie non trouvés');
    return;
  }

  console.log('Événements de messagerie configurés');

  sendButton.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  messageInput.addEventListener('input', () => {
    const hasContent = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasContent || !currentConversation || isMessageSending;
    sendButton.classList.toggle('opacity-50', !hasContent || !currentConversation || isMessageSending);
  });

  startMessagePolling();
  startUnreadCountPolling();
}

async function processMessageQueue() {
  if (isProcessingQueue || messageQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (messageQueue.length > 0) {
    const messageData = messageQueue.shift();
    try {
      await sendMessageToServer(messageData);
    } catch (error) {
      console.error('Erreur traitement queue:', error);
      messageQueue.unshift(messageData);
      break;
    }
  }

  isProcessingQueue = false;
}

async function sendMessageToServer(messageData) {
  try {
    const sentMessage = await sendMessage(messageData);
    console.log('Message envoyé avec succès:', sentMessage);
    
    setTimeout(async () => {
      await loadMessages();
      refreshDiscussions();
    }, 500);
    
    return sentMessage;
  } catch (error) {
    console.error('Erreur envoi serveur:', error);
    throw error;
  }
}

async function handleSendMessage() {
  if (isMessageSending) return;
  
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentConversation) {
    return;
  }

  if (lastMessageId && messageText === lastMessageId) {
    console.warn('Message dupliqué détecté, ignoré');
    return;
  }

  try {
    isMessageSending = true;
    sendButton.disabled = true;
    sendButton.classList.add('opacity-50');
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin text-white"></i>';

    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?.id) {
      throw new Error('Utilisateur non connecté');
    }

    console.log('Envoi du message:', messageText, 'à:', currentConversation);

    const messageData = {
      content: messageText,
      type: 'text',
      senderId: currentUser.id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    if (currentConversation.type === 'contact') {
      messageData.receiverId = currentConversation.id;
      
      await createOrUpdateDiscussion({
        contactId: currentConversation.id,
        participants: [currentUser.id, currentConversation.id],
        lastMessage: {
          content: messageText,
          senderId: currentUser.id,
          timestamp: new Date().toISOString(),
          status: 'sent'
        },
        hasUnreadMessages: false
      });
    } else if (currentConversation.type === 'group') {
      messageData.groupId = currentConversation.id;
      
      await createOrUpdateDiscussion({
        groupId: currentConversation.id,
        isGroup: true,
        participants: [currentUser.id],
        lastMessage: {
          content: messageText,
          senderId: currentUser.id,
          timestamp: new Date().toISOString(),
          status: 'sent'
        },
        hasUnreadMessages: false
      });
    }

    displayOptimisticMessage(messageData);
    messageInput.value = '';
    lastMessageId = messageText;

    messageQueue.push(messageData);
    processMessageQueue();
    
  } catch (error) {
    console.error('Erreur envoi message:', error);
    showMessageError();
  } finally {
    isMessageSending = false;
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.classList.remove('opacity-50');
      sendButton.innerHTML = '<i class="fas fa-paper-plane text-white"></i>';
    }
  }
}

function displayOptimisticMessage(messageData) {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;

  const time = new Date(messageData.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const messageHTML = `
    <div class="flex justify-end mb-4 optimistic-message" data-temp-id="${messageData.timestamp}">
      <div class="message-bubble bg-green-600 p-3 max-w-xs lg:max-w-md">
        <p class="text-sm text-white break-words">${escapeHtml(messageData.content)}</p>
        <div class="flex items-center justify-end space-x-1 mt-1">
          <span class="text-xs text-green-200">${time}</span>
          <i class="fas fa-clock text-gray-400"></i>
        </div>
      </div>
    </div>
  `;

  messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showMessageError() {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  errorDiv.textContent = 'Erreur lors de l\'envoi du message';
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}

export async function setCurrentConversation(type, id, name) {
  console.log('Définition de la conversation courante:', { type, id, name });
  
  currentConversation = { type, id, name };
  
  const contactNameElement = document.getElementById('contactName');
  const firstCharElement = document.getElementById('firstChar');
  const contactStatusElement = document.getElementById('contactStatus');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  
  if (contactNameElement) {
    contactNameElement.textContent = name;
  }
  
  if (firstCharElement && name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    firstCharElement.textContent = initials;
    firstCharElement.innerHTML = initials;
    firstCharElement.className = `avatar ${type === 'group' ? 'bg-green-500' : 'bg-blue-500'}`;
  }

  if (contactStatusElement) {
    contactStatusElement.textContent = type === 'group' ? 'Groupe' : 'en ligne';
  }

  if (messageInput) {
    messageInput.disabled = false;
    messageInput.placeholder = `Envoyer un message à ${name}`;
    messageInput.focus();
  }

  if (sendButton) {
    sendButton.disabled = !messageInput?.value.trim();
    sendButton.classList.toggle('opacity-50', !messageInput?.value.trim());
  }

  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser?.id) {
    preloadConversationMessages(type, id, currentUser.id);
    
    // Marquer la conversation comme lue
    if (type === 'contact') {
      await markConversationAsRead(currentUser.id, id);
    }
  }

  await loadMessages();
}

async function loadMessages() {
  if (!currentConversation) {
    return;
  }

  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) {
    console.error('Conteneur de messages non trouvé');
    return;
  }

  try {
    let messages = [];
    const currentUser = JSON.parse(localStorage.getItem('user'));

    if (currentConversation.type === 'contact') {
      messages = await getMessagesBetweenUsers(currentUser.id, currentConversation.id);
    } else if (currentConversation.type === 'group') {
      messages = await getGroupMessages(currentConversation.id);
    }

    displayMessages(messages, currentUser.id);
    
  } catch (error) {
    console.error('Erreur chargement messages:', error);
    displayEmptyMessages();
  }
}

function displayEmptyMessages() {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;

  messagesContainer.innerHTML = `
    <div class="text-center p-8 text-gray-400">
      <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-comment-dots text-4xl"></i>
      </div>
      <p class="text-lg font-medium">Aucun message dans cette conversation</p>
      <p class="text-sm mt-2">Envoyez le premier message !</p>
    </div>
  `;
}

function displayMessages(messages, currentUserId) {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;

  if (messages.length === 0) {
    displayEmptyMessages();
    return;
  }

  document.querySelectorAll('.optimistic-message').forEach(el => el.remove());

  const uniqueMessages = messages.filter((message, index, self) => 
    index === self.findIndex(m => m.id === message.id)
  );

  const sortedMessages = uniqueMessages.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const messagesByDate = groupMessagesByDate(sortedMessages);
  
  let messagesHTML = '';

  Object.entries(messagesByDate).forEach(([date, dayMessages]) => {
    messagesHTML += `
      <div class="text-center mb-6">
        <span class="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
          ${formatDateSeparator(date)}
        </span>
      </div>
    `;

    dayMessages.forEach(message => {
      const isOwn = message.senderId === currentUserId;
      const time = new Date(message.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      if (isOwn) {
        messagesHTML += `
          <div class="flex justify-end mb-4">
            <div class="message-bubble bg-green-600 p-3 max-w-xs lg:max-w-md rounded-2xl rounded-br-md">
              <p class="text-sm text-white break-words">${escapeHtml(message.content)}</p>
              <div class="flex items-center justify-end space-x-1 mt-1">
                <span class="text-xs text-green-200">${time}</span>
                ${getStatusIcon(message.status)}
              </div>
            </div>
          </div>
        `;
      } else {
        messagesHTML += `
          <div class="flex items-start space-x-2 mb-4">
            <div class="avatar bg-blue-500 text-xs w-8 h-8">
              ${currentConversation.name ? currentConversation.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div class="message-bubble bg-gray-700 p-3 max-w-xs lg:max-w-md rounded-2xl rounded-bl-md">
              <p class="text-sm text-white break-words">${escapeHtml(message.content)}</p>
              <span class="text-xs text-gray-400">${time}</span>
            </div>
          </div>
        `;
      }
    });
  });

  messagesContainer.innerHTML = messagesHTML;
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function groupMessagesByDate(messages) {
  const groups = {};
  
  messages.forEach(message => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });

  return groups;
}

function formatDateSeparator(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Aujourd\'hui';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getStatusIcon(status) {
  switch (status) {
    case 'sent':
      return '<i class="fas fa-check text-gray-400" title="Envoyé"></i>';
    case 'delivered':
      return '<i class="fas fa-check-double text-gray-400" title="Livré"></i>';
    case 'read':
      return '<i class="fas fa-check-double text-blue-400" title="Lu"></i>';
    default:
      return '<i class="fas fa-clock text-gray-400" title="En cours"></i>';
  }
}

async function updateUnreadBadge() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser?.id) return;

    const unreadCount = await getUnreadMessagesCount(currentUser.id);
    
    // Mettre à jour le badge global
    let globalBadge = document.getElementById('global-unread-badge');
    if (unreadCount > 0) {
      if (!globalBadge) {
        globalBadge = document.createElement('span');
        globalBadge.id = 'global-unread-badge';
        globalBadge.className = 'absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold shadow-lg';
        
        const chatIcon = document.querySelector('.fa-comments')?.parentElement;
        if (chatIcon) {
          chatIcon.style.position = 'relative';
          chatIcon.appendChild(globalBadge);
        }
      }
      globalBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      globalBadge.style.display = 'flex';
    } else if (globalBadge) {
      globalBadge.style.display = 'none';
    }

    // Mettre à jour le titre de la page
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) WhatsApp`;
    } else {
      document.title = 'WhatsApp';
    }

  } catch (error) {
    console.error('Erreur mise à jour badge:', error);
  }
}

function startMessagePolling() {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
  }
  
  messagePollingInterval = setInterval(async () => {
    if (currentConversation && !isMessageSending) {
      try {
        await loadMessages();
      } catch (error) {
        console.warn('Erreur polling messages:', error);
      }
    }
  }, 5000);
}

function startUnreadCountPolling() {
  if (unreadCountInterval) {
    clearInterval(unreadCountInterval);
  }
  
  unreadCountInterval = setInterval(async () => {
    try {
      await updateUnreadBadge();
    } catch (error) {
      console.warn('Erreur polling unread count:', error);
    }
  }, 3000);
  
  // Mise à jour immédiate
  updateUnreadBadge();
}

export function stopMessagePolling() {
  if (messagePollingInterval) {
    clearInterval(messagePollingInterval);
    messagePollingInterval = null;
  }
  if (unreadCountInterval) {
    clearInterval(unreadCountInterval);
    unreadCountInterval = null;
  }
}

export function clearCurrentConversation() {
  currentConversation = null;
  lastMessageId = null;
  messageQueue = [];
  
  const contactNameElement = document.getElementById('contactName');
  const firstCharElement = document.getElementById('firstChar');
  const contactStatusElement = document.getElementById('contactStatus');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const messagesContainer = document.getElementById('messages-container');
  
  if (contactNameElement) {
    contactNameElement.textContent = 'Sélectionnez une conversation';
  }
  
  if (firstCharElement) {
    firstCharElement.innerHTML = '<i class="fas fa-user"></i>';
    firstCharElement.className = 'avatar bg-gray-500';
  }

  if (contactStatusElement) {
    contactStatusElement.textContent = '';
  }

  if (messageInput) {
    messageInput.disabled = true;
    messageInput.placeholder = 'Entrez un message';
    messageInput.value = '';
  }

  if (sendButton) {
    sendButton.disabled = true;
    sendButton.classList.add('opacity-50');
  }

  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="text-center p-8 text-gray-400">
        <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-comment-dots text-4xl"></i>
        </div>
        <p class="text-lg font-medium">Sélectionnez une conversation pour commencer à discuter</p>
      </div>
    `;
  }
}

export function clearMessagesCache() {
  clearMessageCache();
}