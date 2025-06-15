export const sortContactsAlphabetically = (contacts) => {
  return [...contacts].sort((a, b) => {
    const nameA = `${a.prenom} ${a.nom}`.toUpperCase();
    const nameB = `${b.prenom} ${b.nom}`.toUpperCase();
    return nameA.localeCompare(nameB);
  });
};

export const filterContacts = (contacts, searchTerm) => {
  if (!searchTerm) return contacts;

  const term = searchTerm.toLowerCase();
  return contacts.filter((contact) => {
    const fullName = `${contact.prenom} ${contact.nom}`.toLowerCase();
    return fullName.includes(term) || contact.telephone.includes(term);
  });
};

export const handleContactSearch = (
  searchTerm,
  allContacts,
  renderContacts
) => {
  if (searchTerm === "*") {
    const sortedContacts = sortContactsAlphabetically(allContacts);
    renderContacts(sortedContacts);
  } else if (searchTerm) {
    const filteredContacts = filterContacts(allContacts, searchTerm);
    renderContacts(filteredContacts);
  } else {
    renderContacts(allContacts);
  }
};
