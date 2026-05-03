import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fastest Claude model — Haiku 4.5
const MODEL = "claude-haiku-4-5-20251001";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { guest_name, toppings, notes } = req.body || {};
    const name = (guest_name || "Gast").toString().slice(0, 80);
    const toppingList = Array.isArray(toppings) ? toppings.slice(0, 30).join(", ") : "";
    const noteText = (notes || "").toString().slice(0, 300);

    const prompt =
      `Du bist eine italienische Mamma, die in ihrer kleinen Pizzeria am Holzofen steht. Ein Gast hat gerade seine Pizza bestellt. Schreib EINEN kurzen, herzlichen, übertrieben dramatischen Kommentar auf DEUTSCH (max. 30 Wörter, mit ein bisschen italienischem Flair wie "Mamma mia", "bellissima", "amore"). Beziehe dich konkret auf mindestens einen Belag oder die Notiz. Sei warm, augenzwinkernd und liebevoll spöttisch — wie eine italienische Nonna, die dich gleichzeitig umarmt und auslacht. Antworte NUR mit dem Kommentar, ohne Anführungszeichen, ohne Einleitung.

Gast: ${name}
Beläge: ${toppingList || "(keine)"}
Notizen: ${noteText || "(keine)"}`;

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const comment =
      msg.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim() || "Bellissima Pizza! 🍕";

    return res.status(200).json({ comment });
  } catch (err) {
    console.error("comment error:", err);
    return res.status(500).json({
      comment: "Mamma mia, der Ofen raucht! Aber deine Pizza wird trotzdem fantastico! 🍕",
    });
  }
}
