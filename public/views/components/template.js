export const templates = {
  contactInfo: (contact) => `
    <div id="contactInfoModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all overflow-hidden">
        <!-- Header avec gradient -->
        <div class="relative bg-gradient-to-r from-green-500 to-green-600 p-6">
          <button class="absolute top-4 right-4 text-white hover:text-gray-200 close-btn transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-2 border-white border-opacity-30">
              ${contact.prenom[0]}${contact.nom[0]}
            </div>
            <div class="text-white">
              <h2 class="text-xl font-bold">${contact.prenom} ${contact.nom}</h2>
              <p class="text-green-100 opacity-90">Informations du contact</p>
            </div>
          </div>
        </div>
        
        <!-- Contenu -->
        <div class="p-6 space-y-4">
          <div class="space-y-4">
            <div class="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Nom complet</p>
                <p class="font-semibold dark:text-white text-gray-900">${contact.prenom} ${contact.nom}</p>
              </div>
            </div>

            <div class="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Téléphone</p>
                <p class="font-semibold dark:text-white text-gray-900">${contact.telephone}</p>
              </div>
            </div>

            <div class="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div class="w-10 h-10 ${contact.blocked ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'} rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 ${contact.blocked ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">Statut</p>
                <p class="font-semibold ${contact.blocked ? 'text-red-500' : 'text-green-500'}">
                  ${contact.blocked ? 'Bloqué' : 'Actif'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  blockedContactsList: (blockedContacts) => {
    if (blockedContacts.length === 0) {
      return `
        <div class="flex flex-col items-center justify-center p-8 text-center">
          <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-user-slash text-gray-400 text-2xl"></i>
          </div>
          <p class="text-gray-400 text-lg font-medium">Aucun contact bloqué</p>
          <p class="text-gray-500 text-sm mt-2">Les contacts que vous bloquez apparaîtront ici</p>
        </div>
      `;
    }

    return blockedContacts
      .map(
        (contact) => `
        <div class="blocked-contact-item flex items-center justify-between p-4 hover:bg-gray-800 transition-colors" data-contact-id="${contact.id}">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
              ${contact.prenom[0]}${contact.nom[0]}
            </div>
            <div>
              <h3 class="text-white font-medium">${contact.prenom} ${contact.nom}</h3>
              <p class="text-gray-400 text-sm">${contact.telephone}</p>
            </div>
          </div>
          <button class="unblock-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium">
            <i class="fas fa-unlock mr-2"></i>Débloquer
          </button>
        </div>
      `
      )
      .join("");
  },

  blockedContactsError: `
    <div class="flex flex-col items-center justify-center p-8 text-center">
      <div class="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
        <i class="fas fa-exclamation-triangle text-white text-2xl"></i>
      </div>
      <p class="text-red-500 text-lg font-medium">Erreur de chargement</p>
      <p class="text-gray-400 text-sm mt-2">Impossible de charger les contacts bloqués</p>
    </div>
  `,

  groupesList: (groupes) => {
    if (groupes.length === 0) {
      return `
        <div class="text-center p-8">
          <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-users text-gray-400 text-2xl"></i>
          </div>
          <p class="text-gray-500 text-lg font-medium">Aucun groupe trouvé</p>
          <p class="text-gray-600 text-sm mt-2">Créez votre premier groupe pour commencer</p>
        </div>`;
    }

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
        ${groupes
          .map(
            (g) => `
          <div class="groupe-item border-b border-gray-200 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" data-group-id="${g.id}">
            <div class="p-4 flex items-center justify-between cursor-pointer">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <i class="fas fa-users text-white"></i>
                </div>
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">${g.nom}</h3>
                  <p class="text-sm text-gray-500 flex items-center">
                    <i class="fas fa-user-friends text-gray-400 mr-1"></i> 
                    ${g.membres.length} ${g.membres.length > 1 ? "membres" : "membre"}
                  </p>
                </div>
              </div>
              <button 
                class="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
                onclick="showContactsToAdd('${g.id}')"
              >
                Ajouter
              </button>
            </div>
          </div>
        `
          )
          .join("")}
      </div>`;
  },
};