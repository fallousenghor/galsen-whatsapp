const BASE_URL = "https://backend-js-server-vrai.onrender.com/messages";
// const BASE_URL = "http://localhost:3000/messages";

// Cache pour éviter les requêtes répétées
const messageCache = new Map();
const conversationCache = new Map();
let lastCacheUpdate = 0;
const CACHE_DURATION = 10000; // 10 secondes pour plus de réactivité

async function fetchData(url, options = {}) {
  console.log('Requête vers:', url);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  
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
    
    const messageId = generateMessageId();
    
    const message = {
      ...messageData,
      id: messageId,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      status: 'sent', // sent -> delivered -> read
      readAt: null,
      deliveredAt: null
    };

    console.log('Envoi du message:', message);

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
        
        // Marquer automatiquement comme livré après un délai
        setTimeout(async () => {
          try {
            await markMessageAsDelivered(result.id);
          } catch (error) {
            console.warn('Erreur marquage livré:', error);
          }
        }, 2000);
        
        return result;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        console.warn(`Tentative ${attempts} échouée, retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
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
    
    if (isCacheValid() && messageCache.has(cacheKey)) {
      console.log('Messages récupérés depuis le cache');
      return messageCache.get(cacheKey);
    }

    console.log('Récupération des messages entre:', userId1, 'et', userId2);
    
    const [sentMessages, receivedMessages] = await Promise.all([
      fetchData(`${BASE_URL}?senderId=${userId1}&receiverId=${userId2}`),
      fetchData(`${BASE_URL}?senderId=${userId2}&receiverId=${userId1}`)
    ]);
    
    const allMessages = [...sentMessages, ...receivedMessages];
    
    const uniqueMessages = allMessages.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    const sortedMessages = uniqueMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    console.log('Messages trouvés:', sortedMessages.length);
    
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
    
    if (isCacheValid() && messageCache.has(cacheKey)) {
      console.log('Messages de groupe récupérés depuis le cache');
      return messageCache.get(cacheKey);
    }

    console.log('Récupération des messages du groupe:', groupId);
    
    const messages = await fetchData(`${BASE_URL}?groupId=${groupId}`);
    
    const uniqueMessages = messages.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    const sortedMessages = uniqueMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    console.log('Messages du groupe trouvés:', sortedMessages.length);
    
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
      body: JSON.stringify({ 
        status: 'read',
        readAt: new Date().toISOString()
      }),
    });
    
    messageCache.clear();
    conversationCache.clear();
    
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
      body: JSON.stringify({ 
        status: 'delivered',
        deliveredAt: new Date().toISOString()
      }),
    });
    
    messageCache.clear();
    conversationCache.clear();
    
    return result;
  } catch (error) {
    console.error("Erreur marquage message livré:", error);
    throw error;
  }
}

export async function markConversationAsRead(userId, contactId) {
  try {
    // Récupérer tous les messages non lus de cette conversation
    const messages = await getMessagesBetweenUsers(userId, contactId);
    const unreadMessages = messages.filter(m => 
      m.receiverId === userId && m.status !== 'read'
    );
    
    // Marquer tous les messages non lus comme lus
    const markPromises = unreadMessages.map(message => 
      markMessageAsRead(message.id)
    );
    
    await Promise.all(markPromises);
    
    console.log(`${unreadMessages.length} messages marqués comme lus`);
    
    return unreadMessages.length;
  } catch (error) {
    console.error("Erreur marquage conversation lue:", error);
    throw error;
  }
}

export async function getUnreadMessagesCount(userId) {
  try {
    const conversations = await getUserConversations(userId);
    let totalUnread = 0;
    
    conversations.forEach(conv => {
      totalUnread += conv.unreadCount || 0;
    });
    
    return totalUnread;
  } catch (error) {
    console.error("Erreur comptage messages non lus:", error);
    return 0;
  }
}

export async function getUserConversations(userId) {
  try {
    const cacheKey = getCacheKey('conversations', userId);
    
    if (isCacheValid() && conversationCache.has(cacheKey)) {
      console.log('Conversations récupérées depuis le cache');
      return conversationCache.get(cacheKey);
    }

    console.log('Récupération des conversations pour:', userId);
    
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
      
      if (!conversation.messages.find(m => m.id === message.id)) {
        conversation.messages.push(message);
      }
      
      // Compter SEULEMENT les messages reçus non lus
      if (message.receiverId === userId && message.status !== 'read') {
        conversation.unreadCount++;
      }
      
      if (new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
        conversation.lastMessage = message;
      }
    });
    
    const result = Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
    
    console.log('Conversations trouvées:', result.length);
    
    conversationCache.set(cacheKey, result);
    updateCacheTimestamp();
    
    return result;
  } catch (error) {
    console.error("Erreur récupération conversations:", error);
    throw error;
  }
}

export function clearMessageCache() {
  messageCache.clear();
  conversationCache.clear();
  lastCacheUpdate = 0;
  console.log('Cache des messages vidé');
}

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