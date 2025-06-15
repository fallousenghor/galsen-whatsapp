const BASE_URL = "https://backend-js-server-vrai.onrender.com/utilisateurs";
// const BASE_URL = "http://localhost:3000/utilisateurs";

export async function createUser(user) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "content-type": "application/JSON" },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    throw new Error("erreur lors de l'inscription");
  }
  return await res.json();
}

export async function getUserByTelephone(telephone) {
  const res = await fetch(
    `${BASE_URL}?telephone=${encodeURIComponent(telephone)}`
  );

  if (!res.ok) {
    throw new Error("Erreur lors de la vérification du numéro");
  }

  const users = await res.json();
  console.log(users);
  return users.length > 0 ? users[0] : null;
}

//  "https://backend-js-server-vrai.onrender.com/contacts",
