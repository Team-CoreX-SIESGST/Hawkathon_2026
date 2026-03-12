const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:5002/api";

async function request(endpoint, method = "GET", body, token) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const apiHealth = () => request("/health");

export const patientRegister = (payload) =>
  request("/patient/register", "POST", payload);
export const patientLogin = (payload) =>{
  console.log('fwoeihfoi')
  request("/patient/login", "POST", payload);
}
export const patientUpdate = (token, payload) =>
  request("/patient/update", "PUT", payload, token);
export const patientMe = (token) => request("/patient/me", "GET", null, token);

export const doctorRegister = (payload) =>
  request("/doctor/register", "POST", payload);
export const doctorLogin = (payload) =>
  request("/doctor/login", "POST", payload);
export const doctorUpdate = (token, payload) =>
  request("/doctor/update", "PUT", payload, token);
export const doctorMe = (token) => request("/doctor/me", "GET", null, token);

export const ashaRegister = (payload) =>
  request("/asha/register", "POST", payload);
export const ashaLogin = (payload) =>
  request("/asha/login", "POST", payload);
export const ashaUpdate = (token, payload) =>
  request("/asha/update", "PUT", payload, token);
export const ashaMe = (token) => request("/asha/me", "GET", null, token);
