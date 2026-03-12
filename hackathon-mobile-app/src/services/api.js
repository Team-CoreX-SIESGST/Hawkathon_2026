const API_BASE_URL = "https://example.com/api";

export async function getHealth() {
  return {
    ok: true,
    baseUrl: API_BASE_URL,
    timestamp: new Date().toISOString(),
  };
}
