import api from "./api";

const TOKEN_KEY = "medinexus_token";
const USER_KEY = "medinexus_user";

export async function register({ fullName, email, password, role = "patient", specialty }) {
  const { data } = await api.post("/api/auth/register", {
    full_name: fullName,
    email,
    password,
    role,
    specialty,
  });
  persistSession(data);
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await api.post("/api/auth/login", { email, password });
  persistSession(data);
  return data.user;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function fetchCurrentUser() {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function updateStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function persistSession(data) {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

// Where each role should land after logging in - used by Login.jsx
export function dashboardPathForRole(role) {
  if (role === "doctor") return "/doctor-dashboard";
  if (role === "admin") return "/admin-dashboard";
  return "/dashboard";
}
