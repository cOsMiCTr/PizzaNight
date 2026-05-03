import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const key = req.query?.key;
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const rows = await sql`
      SELECT guest_num, guest_name, data, updated_at
      FROM orders
      ORDER BY guest_num
    `;
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(rows);
  } catch (err) {
    console.error("orders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
