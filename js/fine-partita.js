/*
 * Fine partita: la finestra (modale) che si apre sopra la partita appena
 * finita con il tempo, le stelline guadagnate e tre sole scelte:
 * Ripeti la sfida, Nuova sfida, Esci. Con 3 stelline partono i coriandoli.
 *
 *   FinePartita.mostra({ gioco, tempo, stelle, soglie, ripeti, nuova, esci })
 *   FinePartita.chiudi()
 *   FinePartita.aperta()
 *
 * Non sa nulla delle regole dei giochi: app.js le dice cosa fare nei tre casi.
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const TITOLI = ["Ci sei quasi!", "Bravo!", "Bravissimo!", "Fantastico!"];
  const COLORI = ["#ff6f59", "#ffc93c", "#3fb984", "#5b8dee", "#8a63d2", "#ff8fa3", "#1fa5a5"];

  let aperta = false;
  let azioni = null;
  let fotogramma = null;
  let timerAvvio = null;

  // ---------- Coriandoli (canvas, nessuna libreria) ----------

  function riduciMovimento() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function fermaCoriandoli() {
    clearTimeout(timerAvvio);
    timerAvvio = null;
    if (fotogramma) cancelAnimationFrame(fotogramma);
    fotogramma = null;
    const c = $("coriandoli");
    if (c) {
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      c.hidden = true;
    }
  }

  function lanciaCoriandoli() {
    const c = $("coriandoli");
    if (!c || riduciMovimento()) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.hidden = false;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // due "cannoni" ai lati in basso + una pioggia dall'alto
    const pezzi = [];
    function pezzo(x, y, vx, vy) {
      pezzi.push({
        x, y, vx, vy,
        w: 6 + Math.random() * 7,
        h: 9 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.4,
        colore: COLORI[Math.floor(Math.random() * COLORI.length)],
        tondo: Math.random() < 0.25,
      });
    }
    for (let i = 0; i < 70; i++) {
      pezzo(0, h * 0.85, 6 + Math.random() * 9, -(10 + Math.random() * 12));
      pezzo(w, h * 0.85, -(6 + Math.random() * 9), -(10 + Math.random() * 12));
    }
    for (let i = 0; i < 90; i++) {
      pezzo(Math.random() * w, -20 - Math.random() * h * 0.5, (Math.random() - 0.5) * 3, 2 + Math.random() * 3);
    }

    const durataMs = 4200;
    const inizio = performance.now();
    function passo(ora) {
      const t = ora - inizio;
      ctx.clearRect(0, 0, w, h);
      const dissolvenza = t > durataMs - 900 ? Math.max(0, (durataMs - t) / 900) : 1;
      pezzi.forEach((p) => {
        p.vy += 0.28; // gravita'
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        ctx.save();
        ctx.globalAlpha = dissolvenza;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.colore;
        if (p.tondo) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      });
      if (t < durataMs) fotogramma = requestAnimationFrame(passo);
      else fermaCoriandoli();
    }
    fotogramma = requestAnimationFrame(passo);
  }

  // ---------- Modale ----------

  function formattaTempo(ms) {
    const s = ms / 1000;
    if (s < 60) return s.toFixed(1) + "s";
    const min = Math.floor(s / 60);
    return min + ":" + (s % 60).toFixed(1).padStart(4, "0");
  }

  function disegnaStelle(n) {
    const box = $("modale-stelle");
    box.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const img = document.createElement("img");
      const presa = i < n;
      img.src = presa ? "img/stella.svg" : "img/stella-vuota.svg";
      img.alt = presa ? "stellina" : "stellina vuota";
      img.className = "modale__stella" + (presa ? " modale__stella--presa" : "");
      img.style.setProperty("--ritardo", 0.35 + i * 0.3 + "s");
      img.draggable = false;
      box.appendChild(img);
    }
    box.setAttribute("aria-label", n === 1 ? "1 stellina" : n + " stelline");
  }

  function legenda(soglie) {
    return "3 stelline sotto i " + soglie[0] + " secondi · 2 sotto i " + soglie[1] + " · 1 sotto i " + soglie[2];
  }

  const FinePartita = {
    aperta() {
      return aperta;
    },

    mostra(o) {
      const modale = $("modale-fine");
      if (!modale) return;
      aperta = true;
      azioni = { ripeti: o.ripeti, nuova: o.nuova, esci: o.esci };

      $("modale-titolo").textContent = TITOLI[o.stelle] || TITOLI[0];
      $("modale-gioco").textContent = o.gioco || "";
      $("modale-tempo").textContent = formattaTempo(o.tempo);
      disegnaStelle(o.stelle);
      $("modale-messaggio").textContent =
        o.stelle === 0
          ? "Nessuna stellina stavolta: riprova, puoi farcela!"
          : o.stelle === 1
          ? "Hai guadagnato 1 stellina!"
          : "Hai guadagnato " + o.stelle + " stelline!";
      $("modale-legenda").textContent = legenda(o.soglie);

      modale.classList.toggle("modale--tre-stelle", o.stelle === 3);
      modale.hidden = false;
      const primo = $("modale-nuova");
      if (primo) primo.focus({ preventScroll: true });

      fermaCoriandoli();
      if (o.stelle === 3) timerAvvio = setTimeout(lanciaCoriandoli, 900); // quando la 3a stella e' comparsa
    },

    chiudi() {
      const modale = $("modale-fine");
      aperta = false;
      azioni = null;
      fermaCoriandoli();
      if (modale) modale.hidden = true;
    },
  };

  window.FinePartita = FinePartita;

  function scegli(nome) {
    return () => {
      if (!aperta || !azioni) return;
      const fn = azioni[nome];
      FinePartita.chiudi();
      if (typeof fn === "function") fn();
    };
  }

  function init() {
    const r = $("modale-ripeti");
    const n = $("modale-nuova");
    const e = $("modale-esci");
    if (r) r.addEventListener("click", scegli("ripeti"));
    if (n) n.addEventListener("click", scegli("nuova"));
    if (e) e.addEventListener("click", scegli("esci"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
