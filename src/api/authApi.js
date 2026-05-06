import axios from "./config"

export async function register(email, password) {
  const response = await axios.post("/api/users/register", {
    email,
    password
  })

  return response.data
}

export async function login(email, password) {
  const response = await axios.post("/api/auth/login", {
    email,
    password
  })

  return response.data
}