export function showError(message) {
  alert(message);
}

export async function updateContactsList(contacts) {
  const contactsContainer = document.getElementById("contacts-list");
  if (!contactsContainer) return;

  const contactsHTML = contacts
    .map(
      (contact) => `
      <div class="contact-item flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-800"
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
            <div class="text-white text-base">${contact.prenom} ${
        contact.nom
      }</div>
            <div class="text-gray-400 text-sm">${contact.telephone}</div>
          </div>
        </div>
      </div>
    `
    )
    .join("");

  contactsContainer.innerHTML = contactsHTML;
}

export async function handleApiResponse(response, errorMessage) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || errorMessage);
  }
  return response.json();
}
