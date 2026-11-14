(() => {
  "use strict";
  const startAt = new Date("2026-11-15T18:00:00+05:30").getTime();
  const launchAt = new Date("2026-11-15T18:30:00+05:30").getTime();
  let timer = null;
  let opened = false;

  function addStyles() {
    if (document.getElementById("oyms-launch-style")) return;
    const style = document.createElement("style");
    style.id = "oyms-launch-style";
    style.textContent = `
      .oyms-launch-overlay{position:fixed;inset:0;z-index:99999;display:none;place-items:center;padding:18px;background:rgba(20,10,35,.78);backdrop-filter:blur(7px)}
      .oyms-launch-overlay.is-visible{display:grid}
      .oyms-launch-card{position:relative;overflow:hidden;width:min(100%,560px);padding:38px 28px 30px;text-align:center;color:#fff;border:1px solid rgba(255,255,255,.24);border-radius:22px;background:radial-gradient(circle at 50% 0%,#6d43a5 0,#321657 58%,#1d1031 100%);box-shadow:0 28px 90px #10071f99}
      .oyms-launch-kicker{display:inline-block;padding:7px 13px;border:1px solid #e7c56d88;border-radius:99px;color:#f5d98c;font-size:11px;font-weight:800;letter-spacing:2px}
      .oyms-launch-card h2{margin:18px 0 10px;color:#fff;font-size:clamp(25px,5vw,38px);line-height:1.12}
      .oyms-launch-card p{margin:0 auto;color:#e7def2;max-width:430px;line-height:1.6;font-size:14px}
      .oyms-launch-clock{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:27px auto 18px;max-width:390px}
      .oyms-launch-time{padding:16px 8px;border:1px solid #ffffff26;border-radius:12px;background:#ffffff12}
      .oyms-launch-time strong{display:block;font-size:clamp(30px,7vw,42px);font-variant-numeric:tabular-nums;color:#ffdf8b;line-height:1}
      .oyms-launch-time span{display:block;margin-top:8px;color:#e8ddf3;font-size:10px;letter-spacing:1.5px;font-weight:800}
      .oyms-launch-date{margin-top:12px!important;color:#f5d98c!important;font-weight:700}
      .oyms-launch-close{position:absolute;right:13px;top:12px;width:36px;height:36px;border:0;border-radius:50%;background:#ffffff18;color:#fff;font-size:24px;cursor:pointer}
      .oyms-launch-close:hover{background:#ffffff30}
      .oyms-launch-confetti{position:fixed;top:-18px;z-index:100000;width:9px;height:15px;pointer-events:none;animation:oyms-confetti-fall var(--fall,3.5s) linear forwards;transform:rotate(var(--spin,0deg))}
      @keyframes oyms-confetti-fall{to{transform:translate3d(var(--drift,30px),110vh,0) rotate(900deg);opacity:.9}}
      @media(max-width:480px){.oyms-launch-card{padding:34px 18px 24px}.oyms-launch-clock{gap:7px}.oyms-launch-time{padding:14px 5px}}
      @media(prefers-reduced-motion:reduce){.oyms-launch-confetti{display:none!important}.oyms-launch-card *{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function buildPopup() {
    const overlay = document.createElement("div");
    overlay.className = "oyms-launch-overlay";
    overlay.id = "oymsLaunchOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "oymsLaunchTitle");
    overlay.innerHTML = `
      <section class="oyms-launch-card">
        <button class="oyms-launch-close" type="button" aria-label="Close launch announcement">×</button>
        <span class="oyms-launch-kicker">PM SHRI KV OF MEDAK · BSG</span>
        <h2 id="oymsLaunchTitle">The launch is almost here!</h2>
        <p id="oymsLaunchMessage">Get ready for the official launch of SANKALP 2.0 — the Scouts &amp; Guides coordination portal.</p>
        <div class="oyms-launch-clock" id="oymsLaunchClock" aria-live="polite">
          <div class="oyms-launch-time"><strong id="oymsLaunchHours">00</strong><span>HOURS</span></div>
          <div class="oyms-launch-time"><strong id="oymsLaunchMinutes">30</strong><span>MINUTES</span></div>
          <div class="oyms-launch-time"><strong id="oymsLaunchSeconds">00</strong><span>SECONDS</span></div>
        </div>
        <p class="oyms-launch-date" id="oymsLaunchDate">15 November 2026 · 6:30 PM IST</p>
      </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".oyms-launch-close").addEventListener("click", () => {
      overlay.classList.remove("is-visible");
    });
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.remove("is-visible");
    });
    return overlay;
  }

  function celebrate() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const palette = ["#f6cf65", "#ffffff", "#9b7bd0", "#e77c9b", "#77d6c1", "#f39b52"];
    for (let i = 0; i < 105; i++) {
      const piece = document.createElement("i");
      piece.className = "oyms-launch-confetti";
      piece.style.left = (Math.random() * 100) + "vw";
      piece.style.background = palette[i % palette.length];
      piece.style.setProperty("--fall", (2.5 + Math.random() * 2.5) + "s");
      piece.style.setProperty("--drift", ((Math.random() - .5) * 260) + "px");
      piece.style.setProperty("--spin", (Math.random() * 360) + "deg");
      piece.style.animationDelay = (Math.random() * .8) + "s";
      document.body.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove(), {once:true});
    }
  }

  function showLaunched(overlay) {
    if (timer) clearInterval(timer);
    document.getElementById("oymsLaunchTitle").textContent = "SANKALP 2.0 IS OFFICIALLY LAUNCHED!";
    document.getElementById("oymsLaunchMessage").textContent = "The launch moment is here. Welcome to the PM SHRI KV OF Medak Scouts & Guides coordination portal!";
    document.getElementById("oymsLaunchClock").innerHTML = '<div class="oyms-launch-time" style="grid-column:1/-1"><strong style="font-size:30px">🎉 LAUNCHED 🎉</strong><span>15 NOVEMBER 2026 · 6:30 PM IST</span></div>';
    document.getElementById("oymsLaunchDate").textContent = "Thank you for being part of this special occasion.";
    overlay.classList.add("is-visible");
    celebrate();
  }

  function tick(overlay) {
    const now = Date.now();
    if (now >= launchAt) {
      showLaunched(overlay);
      return;
    }
    const remaining = Math.max(0, launchAt - now);
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    document.getElementById("oymsLaunchHours").textContent = String(hours).padStart(2,"0");
    document.getElementById("oymsLaunchMinutes").textContent = String(minutes).padStart(2,"0");
    document.getElementById("oymsLaunchSeconds").textContent = String(seconds).padStart(2,"0");
  }

  function init() {
    if (opened) return;
    const now = Date.now();
    if (now < startAt) {
      const wait = startAt - now;
      window.setTimeout(init, Math.min(wait, 2147480000));
      return;
    }
    opened = true;
    addStyles();
    const overlay = buildPopup();
    overlay.classList.add("is-visible");
    if (Date.now() >= launchAt) {
      showLaunched(overlay);
    } else {
      tick(overlay);
      timer = window.setInterval(() => tick(overlay), 1000);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();