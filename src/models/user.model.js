import { createUser } from "../services/register.service.js";

export async function addUser(data) {
  return await createUser(data);
}
