const BASE_URL = "https://backend-js-server-vrai.onrender.com/messages";
// const BASE_URL = "http://localhost:3000/messages";

// Cache pour éviter les requêtes répétées
const messageCache = new Map();
const conversationCache = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 30000; // 30 secondes

async function fetchData(url, options = {}) {
  console.log('Requête vers:', url);
  
  // Ajouter un timeout pour éviter les requêtes qui traînent
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur de réponse:', errorText);
      throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La requête a pris trop de temps');
    }
    throw error;
  }
}

function getCurrentUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?.id) throw new Error("Utilisateur non connecté");
  return user;
}

function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCacheKey(type, ...params) {
  return `${type}_${params.join('_')}`;
}

function isCacheValid() {
  return Date.now() - lastCacheUpdate < CACHE_DURATION;
}

function updateCacheTimestamp() {
  lastCacheUpdate = Date.now();
}

export async function sendMessage(messageData) {
  try {
    const user = getCurrentUser();
    
    // Générer un ID unique pour éviter les doublons
    const messageId = generateMessageId();
    
    const message = {
      ...messageData,
      id: messageId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    console.log('Envoi du message:', message);

    // Envoyer le message avec retry en cas d'échec
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const result = await fetchData(BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        });

        console.log('Message envoyé avec succès:', result);
        
        // Invalider le cache pour forcer le rechargement
        messageCache.clear();
        conversationCache.clear();
        updateCacheTimestamp();
        
        return result;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        console.warn(`Tentative ${attempts} échouée, retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Délai progressif
      }
    }
  } catch (error) {
    console.error("Erreur envoi message:", error);
    throw error;
  }
}

export async function getMessagesBetweenUsers(userId1, userId2) {
  try {
    const cacheKey = getCacheKey('messages', userId1, userId2);
    
    // Vérifier le cache
    if (isCacheValid() && messageCache.has(cacheKey)) {
      console.log('Messages récupérés depuis le cache');
      return messageCache.get(cacheKey);
    }

    console.log('Récupération des messages entre:', userId1, 'et', userId2);
    
    // Utiliser Promise.all pour paralléliser les requêtes
    const [sentMessages, receivedMessages] = await Promise.all([
      fetchData(`${BASE_URL}?senderId=${userId1}&receiverId=${userId2}`),
      fetchData(`${BASE_URL}?senderId=${userId2}&receiverId=${userId1}`)
    ]);
    
    const allMessages = [...sentMessages, ...receivedMessages];
    
    // Supprimer les doublons basés sur l'ID
    const uniqueMessages = allMessages.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    const sortedMessages = uniqueMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    console.log('Messages trouvés:', sortedMessages.length);
    
    // Mettre en cache
    messageCache.set(cacheKey, sortedMessages);
    updateCacheTimestamp();
    
    return sortedMessages;
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    throw error;
  }
}

export async function getGroupMessages(groupId) {
  try {
    const cacheKey = getCacheKey('group_messages', groupId);
    
    // Vérifier le cache
    if (isCacheValid() && messageCache.has(cacheKey)) {
      console.log('Messages de groupe récupérés depuis le cache');
      return messageCache.get(cacheKey);
    }

    console.log('Récupération des messages du groupe:', groupId);
    
    const messages = await fetchData(`${BASE_URL}?groupId=${groupId}`);
    
    // Supprimer les doublons
    const uniqueMessages = messages.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    const sortedMessages = uniqueMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    console.log('Messages du groupe trouvés:', sortedMessages.length);
    
    // Mettre en cache
    messageCache.set(cacheKey, sortedMessages);
    updateCacheTimestamp();
    
    return sortedMessages;
  } catch (error) {
    console.error("Erreur récupération messages groupe:", error);
    throw error;
  }
}

export async function markMessageAsRead(messageId) {
  try {
    const result = await fetchData(`${BASE_URL}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'read' }),
    });
    
    // Invalider le cache
    messageCache.clear();
    
    return result;
  } catch (error) {
    console.error("Erreur marquage message lu:", error);
    throw error;
  }
}

export async function markMessageAsDelivered(messageId) {
  try {
    const result = await fetchData(`${BASE_URL}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'delivered' }),
    });
    
    // Invalider le cache
    messageCache.clear();
    
    return result;
  } catch (error) {
    console.error("Erreur marquage message livré:", error);
    throw error;
  }
}

export async function getUserConversations(userId) {
  try {
    const cacheKey = getCacheKey('conversations', userId);
    
    // Vérifier le cache
    if (isCacheValid() && conversationCache.has(cacheKey)) {
      console.log('Conversations récupérées depuis le cache');
      return conversationCache.get(cacheKey);
    }

    console.log('Récupération des conversations pour:', userId);
    
    // Paralléliser les requêtes
    const [sentMessages, receivedMessages] = await Promise.all([
      fetchData(`${BASE_URL}?senderId=${userId}`),
      fetchData(`${BASE_URL}?receiverId=${userId}`)
    ]);
    
    const conversations = new Map();
    
    [...sentMessages, ...receivedMessages].forEach(message => {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const conversationId = message.groupId || otherUserId;
      
      if (!conversations.has(conversationId)) {
        conversations.set(conversationId, {
          id: conversationId,
          isGroup: !!message.groupId,
          lastMessage: message,
          unreadCount: 0,
          messages: []
        });
      }
      
      const conversation = conversations.get(conversationId);
      
      // Éviter les doublons dans les messages de conversation
      if (!conversation.messages.find(m => m.id === message.id)) {
        conversation.messages.push(message);
      }
      
      // Compter les messages non lus
      if (message.receiverId === userId && message.status !== 'read') {
        conversation.unreadCount++;
      }
      
      // Garder le dernier message
      if (new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
        conversation.lastMessage = message;
      }
    });
    
    const result = Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
    
    console.log('Conversations trouvées:', result.length);
    
    // Mettre en cache
    conversationCache.set(cacheKey, result);
    updateCacheTimestamp();
    
    return result;
  } catch (error) {
    console.error("Erreur récupération conversations:", error);
    throw error;
  }
}

// Fonction pour vider le cache manuellement
export function clearMessageCache() {
  messageCache.clear();
  conversationCache.clear();
  lastCacheUpdate = 0;
  console.log('Cache des messages vidé');
}

// Fonction pour précharger les messages d'une conversation
export async function preloadConversationMessages(type, id, userId) {
  try {
    if (type === 'contact') {
      await getMessagesBetweenUsers(userId, id);
    } else if (type === 'group') {
      await getGroupMessages(id);
    }
  } catch (error) {
    console.warn('Erreur préchargement messages:', error);
  }
}