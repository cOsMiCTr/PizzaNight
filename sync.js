/* Pizza Night — server sync + AI comment popup
   Loaded synchronously in <head>. Wraps localStorage.setItem so every
   save in the original page logic also fans out to /api/order.
   Also injects a "Bestellen!" button per card that calls /api/comment. */

(function () {
  const STORAGE_KEY = "pizza-night-state-v2";
  const SYNC_URL = "/api/order";
  const COMMENT_URL = "/api/comment";

  // ---------- 1. Sync localStorage saves to the server ----------
  const origSetItem = localStorage.setItem.bind(localStorage);
  let syncTimer;
  let lastSent = "";

  localStorage.setItem = function (key, value) {
    origSetItem(key, value);
    if (key !== STORAGE_KEY) return;
    if (value === lastSent) return;
    lastSent = value;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => pushAll(value), 500);
  };

  function getNames() {
    const names = {};
    document.querySelectorAll(".guest-card").forEach((c) => {
      const num = c.dataset.guest;
      const name = c.querySelector(".name")?.textContent?.trim() || "";
      names[num] = name;
    });
    return names;
  }

  function pushAll(json) {
    let state;
    try { state = JSON.parse(json); } catch (e) { return; }
    if (!state || typeof state !== "object") return;
    const names = getNames();
    Object.keys(state).forEach((num) => {
      fetch(SYNC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_num: Number(num),
          guest_name: names[num] || "",
          data: state[num] || {},
        }),
      }).catch(() => {});
    });
  }

  // ---------- 2. Inject "Bestellen!" button + AI popup ----------
  const css = `
    .order-btn{
      appearance:none;border:0;cursor:pointer;
      font-family:"DM Sans",system-ui,sans-serif;
      font-weight:800;font-size:14px;
      background:linear-gradient(135deg,#c8321f,#9a2614);
      color:#fff;
      padding:12px 18px;border-radius:14px;
      box-shadow:0 2px 0 #9a2614,0 8px 18px -8px #9a2614aa;
      letter-spacing:.02em;
      margin-right:auto;
    }
    .order-btn:active{ transform:translateY(1px); }
    .order-btn:disabled{ opacity:.5; cursor:not-allowed; }

    .pizza-modal-bg{
      position:fixed;inset:0;z-index:100;
      background:#2a1d1299;
      display:none;align-items:center;justify-content:center;
      padding:20px;
      backdrop-filter: blur(4px);
      animation: fadeIn .2s ease;
    }
    .pizza-modal-bg.show{ display:flex; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes pop { 0%{transform:scale(.85);opacity:0} 100%{transform:scale(1);opacity:1} }

    .pizza-modal{
      background:#fbf6ea;
      border:2px solid #2a1d1233;
      border-radius:24px;
      padding:28px 26px 22px;
      max-width:420px; width:100%;
      box-shadow: 0 30px 60px -20px #00000080;
      position:relative;
      animation: pop .3s cubic-bezier(.5,1.6,.4,1);
      text-align:center;
    }
    .pizza-modal .mamma{
      font-family:"Caveat",cursive;
      font-size:24px;
      color:#c8321f;
      transform:rotate(-2deg);
      display:inline-block;
      margin-bottom:6px;
    }
    .pizza-modal .quote{
      font-family:"Fraunces",serif;
      font-style:italic;
      font-weight:500;
      font-size:20px;
      line-height:1.35;
      color:#2a1d12;
      margin:8px 0 18px;
      text-wrap:pretty;
    }
    .pizza-modal .loading{
      font-family:"Fraunces",serif;
      font-style:italic;
      color:#8a7458;
      font-size:16px;
      padding:18px 0;
    }
    .pizza-modal .ok-btn{
      appearance:none;border:0;cursor:pointer;
      font-family:"DM Sans",sans-serif;
      font-weight:700;font-size:14px;
      background:#2a1d12;color:#f7efe1;
      padding:12px 22px;border-radius:12px;
      box-shadow:0 2px 0 #000;
    }
    .pizza-modal .ok-btn:active{ transform:translateY(1px); }
    .pizza-modal .pizza-emoji{
      font-size:44px;
      margin-bottom:4px;
      display:block;
    }
  `;

  function injectCss() {
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  // Build modal entirely with safe DOM methods (no innerHTML)
  function buildModal() {
    const bg = document.createElement("div");
    bg.className = "pizza-modal-bg";
    bg.id = "pizzaModal";

    const modal = document.createElement("div");
    modal.className = "pizza-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    const emoji = document.createElement("span");
    emoji.className = "pizza-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = "🍕";

    const mamma = document.createElement("span");
    mamma.className = "mamma";
    mamma.textContent = "Mamma sagt…";

    const quote = document.createElement("div");
    quote.className = "quote";
    quote.id = "pizzaModalText";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ok-btn";
    closeBtn.id = "pizzaModalClose";
    closeBtn.textContent = "Grazie!";

    modal.appendChild(emoji);
    modal.appendChild(mamma);
    modal.appendChild(quote);
    modal.appendChild(closeBtn);
    bg.appendChild(modal);
    document.body.appendChild(bg);

    bg.addEventListener("click", (e) => {
      if (e.target === bg || e.target.id === "pizzaModalClose") {
        bg.classList.remove("show");
      }
    });
  }

  function showLoading() {
    const bg = document.getElementById("pizzaModal");
    const txt = document.getElementById("pizzaModalText");
    txt.textContent = "";
    const span = document.createElement("span");
    span.className = "loading";
    span.textContent = "Mamma überlegt…";
    txt.appendChild(span);
    bg.classList.add("show");
  }

  function showText(text) {
    const bg = document.getElementById("pizzaModal");
    const txt = document.getElementById("pizzaModalText");
    txt.textContent = text;
    bg.classList.add("show");
  }

  function gatherSelection(card) {
    const guestNum = card.dataset.guest;
    const name = card.querySelector(".name")?.textContent?.trim() || "";
    const toppings = [];
    card.querySelectorAll(".topping.checked .t-name").forEach((el) =>
      toppings.push(el.textContent.trim())
    );
    const notes = card.querySelector("textarea[data-key='notes']")?.value?.trim() || "";
    return { guest_num: Number(guestNum), guest_name: name, toppings, notes };
  }

  async function handleOrder(card, btn) {
    const sel = gatherSelection(card);
    if (sel.toppings.length === 0 && !sel.notes) {
      showText("Madonna mia! Du hast noch nichts ausgewählt — wähle erst deine Beläge!");
      return;
    }
    btn.disabled = true;
    showLoading();
    try {
      const res = await fetch(COMMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sel),
      });
      const json = await res.json();
      showText(json.comment || "Bellissima Pizza! 🍕");
    } catch (e) {
      showText("Mamma mia, die Leitung in die Küche ist tot! Aber deine Bestellung ist gespeichert. 🍕");
    } finally {
      btn.disabled = false;
    }
  }

  function injectButtons() {
    document.querySelectorAll(".guest-card").forEach((card) => {
      const actions = card.querySelector(".row-actions");
      if (!actions || actions.querySelector(".order-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "order-btn";
      btn.textContent = "Bestellen! 🍕";
      actions.insertBefore(btn, actions.firstChild);
      btn.addEventListener("click", () => handleOrder(card, btn));
    });
  }

  function whenReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(fn, 0);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  whenReady(() => {
    injectCss();
    buildModal();
    injectButtons();
    // Re-inject button after per-card reset (which replaces the card node)
    const root = document.getElementById("guests");
    if (root) {
      new MutationObserver(() => injectButtons()).observe(root, {
        childList: true,
        subtree: false,
      });
    }
  });
})();
