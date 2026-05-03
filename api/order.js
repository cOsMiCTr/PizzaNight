import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

let initialized = false;
async function ensureSchema() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      guest_num INT PRIMARY KEY,
      guest_name TEXT,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  initialized = true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await ensureSchema();
    const { guest_num, guest_name, data } = req.body || {};
    if (typeof guest_num !== "number" || guest_num < 1 || guest_num > 99) {
      return res.status(400).json({ error: "Invalid guest_num" });
    }
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Invalid data" });
    }

    await sql`
      INSERT INTO orders (guest_num, guest_name, data, updated_at)
      VALUES (${guest_num}, ${guest_name || ""}, ${JSON.stringify(data)}, NOW())
      ON CONFLICT (guest_num) DO UPDATE SET
        guest_name = EXCLUDED.guest_name,
        data = EXCLUDED.data,
        updated_at = NOW()
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("order error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
