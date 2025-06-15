const BASE_URL = "https://backend-js-server-vrai.onrender.com/messages";
// const BASE_URL = "http://localhost:3000/messages";

async function fetchData(url, options = {}) {
  console.log('Requête vers:', url, 'avec options:', options);
  
  const response = await fetch(url, options);
  
  console.log('Réponse reçue:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erreur de réponse:', errorText);
    throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  console.log('Données reçues:', data);
  
  return data;
}

function getCurrentUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user?.id) throw new Error("Utilisateur non connecté");
  return user;
}

export async function sendMessage(messageData) {
  try {
    const user = getCurrentUser();
    
    const message = {
      ...messageData,
      senderId: user.id,
      timestamp: new Date().toISOString(),
      status: 'sent',
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };

    console.log('Envoi du message:', message);

    const result = await fetchData(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    console.log('Message envoyé avec succès:', result);
    return result;
  } catch (error) {
    console.error("Erreur envoi message:", error);
    throw error;
  }
}

export async function getMessagesBetweenUsers(userId1, userId2) {
  try {
    console.log('Récupération des messages entre:', userId1, 'et', userId2);
    
    // Récupérer les messages envoyés par userId1 à userId2
    const sentMessages = await fetchData(`${BASE_URL}?senderId=${userId1}&receiverId=${userId2}`);
    
    // Récupérer les messages envoyés par userId2 à userId1
    const receivedMessages = await fetchData(`${BASE_URL}?senderId=${userId2}&receiverId=${userId1}`);
    
    const allMessages = [...sentMessages, ...receivedMessages];
    
    console.log('Messages trouvés:', allMessages.length);
    
    return allMessages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  } catch (error) {
    console.error("Erreur récupération messages:", error);
    throw error;
  }
}

export async function getGroupMessages(groupId) {
  try {
    console.log('Récupération des messages du groupe:', groupId);
    
    const messages = await fetchData(`${BASE_URL}?groupId=${groupId}`);
    
    console.log('Messages du groupe trouvés:', messages.length);
    
    return messages.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  } catch (error) {
    console.error("Erreur récupération messages groupe:", error);
    throw error;
  }
}

export async function markMessageAsRead(messageId) {
  try {
    return await fetchData(`${BASE_URL}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'read' }),
    });
  } catch (error) {
    console.error("Erreur marquage message lu:", error);
    throw error;
  }
}

export async function markMessageAsDelivered(messageId) {
  try {
    return await fetchData(`${BASE_URL}/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: 'delivered' }),
    });
  } catch (error) {
    console.error("Erreur marquage message livré:", error);
    throw error;
  }
}

export async function getUserConversations(userId) {
  try {
    console.log('Récupération des conversations pour:', userId);
    
    const sentMessages = await fetchData(`${BASE_URL}?senderId=${userId}`);
    const receivedMessages = await fetchData(`${BASE_URL}?receiverId=${userId}`);
    
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
      conversation.messages.push(message);
      
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
    
    return result;
  } catch (error) {
    console.error("Erreur récupération conversations:", error);
    throw error;
  }
}