const BASE_URL = "https://backend-js-server-vrai.onrender.com/discussions";
// const BASE_URL = "http://localhost:3000/discussions";

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

export async function createOrUpdateDiscussion(discussionData) {
  try {
    const user = getCurrentUser();
    
    const discussion = {
      ...discussionData,
      participants: discussionData.participants || [],
      lastActivity: new Date().toISOString(),
      createdBy: user.id,
      isFavorite: false,
      isArchived: false
    };

    // Vérifier si la discussion existe déjà
    const existingDiscussions = await getUserDiscussions(user.id);
    const existing = existingDiscussions.find(d => 
      d.contactId === discussionData.contactId || 
      d.groupId === discussionData.groupId
    );

    if (existing) {
      return await fetchData(`${BASE_URL}/${existing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...existing, ...discussion }),
      });
    }

    return await fetchData(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discussion),
    });
  } catch (error) {
    console.error("Erreur création/mise à jour discussion:", error);
    throw error;
  }
}

export async function getUserDiscussions(userId) {
  try {
    const discussions = await fetchData(`${BASE_URL}?participants_like=${userId}`);
    return discussions.filter(d => !d.isArchived);
  } catch (error) {
    console.error("Erreur récupération discussions:", error);
    throw error;
  }
}

export async function toggleFavoriteDiscussion(discussionId) {
  try {
    const discussion = await fetchData(`${BASE_URL}/${discussionId}`);
    return await fetchData(`${BASE_URL}/${discussionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !discussion.isFavorite }),
    });
  } catch (error) {
    console.error("Erreur toggle favori:", error);
    throw error;
  }
}

export async function markDiscussionAsRead(discussionId) {
  try {
    return await fetchData(`${BASE_URL}/${discussionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        hasUnreadMessages: false,
        lastReadAt: new Date().toISOString()
      }),
    });
  } catch (error) {
    console.error("Erreur marquage discussion lue:", error);
    throw error;
  }
}