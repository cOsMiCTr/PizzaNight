# Pizza Night 🍕

Belag-Auswahl-App für unsere Pizza Night. Mobile-first, mit Admin-Übersicht
und einem witzigen KI-Mamma-Kommentar bei jeder Bestellung.

## Aufbau

```
pizza-night/
├── index.html          ← Gäste-Seite (Original-Design unverändert)
├── sync.js             ← Synchronisiert localStorage → Server, AI-Popup
├── admin.html          ← Admin-Übersicht (/admin.html?key=...)
├── api/
│   ├── order.js        ← POST: speichert Bestellung in Postgres
│   ├── orders.js       ← GET: liest alle Bestellungen (mit Admin-Key)
│   └── comment.js      ← POST: holt KI-Kommentar von Claude Haiku 4.5
├── package.json
└── .gitignore
```

## Deploy auf Vercel

1. `vercel link` (falls noch nicht verknüpft)
2. **Neon Postgres** im Vercel-Dashboard hinzufügen:
   Project → Storage → Create Database → Neon (Free)
   → setzt automatisch `DATABASE_URL` als Env-Variable.
3. **Anthropic API Key** als Env-Variable setzen:
   Project → Settings → Environment Variables → `ANTHROPIC_API_KEY`
4. **Admin-Schlüssel** setzen:
   Env-Variable → `ADMIN_KEY` → z. B. `pizza2026`
5. `vercel --prod` deployen.

Beim ersten POST an `/api/order` wird die Tabelle automatisch angelegt.

## Lokal testen

```bash
npm install
vercel dev
```

`.env.local` mit:
```
DATABASE_URL=postgres://...
ANTHROPIC_API_KEY=sk-ant-...
ADMIN_KEY=pizza2026
```

## URLs

- Gäste-Seite:  `https://<dein-projekt>.vercel.app/`
- Admin-View:   `https://<dein-projekt>.vercel.app/admin.html?key=pizza2026`

## Wie es funktioniert

- Die Original-HTML speichert Auswahlen in `localStorage`
  (Schlüssel `pizza-night-state-v2`).
- `sync.js` hängt sich an `localStorage.setItem` und schickt
  jede Änderung (debounced auf 500&nbsp;ms) per `POST /api/order` an Postgres.
- Admin-Seite pollt `/api/orders` alle 5&nbsp;Sek.
- Klick auf **„Bestellen! 🍕"** → schickt die Auswahl an `/api/comment`,
  Claude Haiku 4.5 antwortet als italienische Mamma → Popup.

## Kosten

- Vercel Hobby: **0 €**
- Neon Free: **0 €** (0,5 GB)
- Claude Haiku 4.5: ~0,001 € pro Kommentar (8 Gäste × ~3 Klicks ≈ 0,03 €)
