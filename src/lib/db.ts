import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL is missing");
    if (!authToken) throw new Error("TURSO_AUTH_TOKEN is missing");
    _client = createClient({ url, authToken });
  }
  return _client;
}
