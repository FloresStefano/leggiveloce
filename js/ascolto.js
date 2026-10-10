/*
 * Ascolto: riconoscimento vocale OPZIONALE per i giochi di lettura.
 *
 * Funziona "in parallelo" al gioco: se l'opzione e' spenta, se il browser non
 * supporta il riconoscimento o se il microfono viene negato, il gioco si
 * comporta esattamente come prima (cronometro, FINE, ecc.).
 *
 * Usa la Web Speech API del browser (SpeechRecognition / webkitSpeechRecognition,
 * lingua it-IT). ATTENZIONE: nella modalita' predefinita il browser invia
 * l'audio a un servizio di riconoscimento esterno (Google su Chrome, Apple su
 * Safari); non viene salvato nulla da questa app.
 *
 * Cosa fa durante una partita (solo giochi con `ascolto: true` in games.js):
 * - ascolta il microfono e, quando riconosce una delle parole a schermo,
 *   la evidenzia (classe .parola-tile--letta);
 * - un tocco su una parola la pronuncia (sintesi vocale);
 * - un doppio tocco su una parola la evidenzia come se fosse stata letta;
 * - quando tutte le parole sono evidenziate chiama cfg.tutteLette(), che nel
 *   gioco equivale a premere FINE (timer fermo + schermata del tempo).
 *
 * L'app (app.js) lo usa cosi':
 *   Ascolto.nuovoAvvio()  -> partita lanciata dalla home: interruttore acceso
 *   Ascolto.apri(cfg)     -> schermata di gioco pronta (parte anche il microfono)
 *   Ascolto.riprendi()    -> il cronometro e' partito / ripreso
 *   Ascolto.pausa()       -> il cronometro e' in pausa
 *   Ascolto.chiudi()      -> partita finita / uscita: microfono spento
 */
(function () {
  "use strict";

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const LINGUA = "it-IT";
  const DOPPIO_TOCCO_MS = 300; // finestra per riconoscere il doppio tocco
  const ATTESA_DOPO_VOCE_MS = 500; // il microfono riparte dopo la sintesi vocale
  const RITARDO_RIAVVIO_MS = 250; // riavvio automatico quando il browser chiude l'ascolto
  const MAX_RIAVVII_RAVVICINATI = 5;

  let cfg = null; // { griglia, parole, inCorso(), inPausa(), tutteLette() }
  let letta = []; // letta[i] === true se la parola i e' evidenziata
  let attivo = true; // stato dell'interruttore "🎤 Ascolto"
  let voluto = false; // vogliamo che il microfono sia acceso
  let sospeso = false; // in pausa temporanea (mentre parla la sintesi vocale)
  let rec = null; // riconoscitore corrente
  let riavvioTimer = null;
  let ultimoAvvio = 0;
  let riavviRavvicinati = 0;
  let completato = false;
  let ultimoTocco = null; // { i, t, timer }
  let voceId = 0;
  let voceTimer = null;

  const $ = (id) => document.getElementById(id);

  // ---------- Interfaccia (interruttore + stato) ----------

  function mostraStato(testo, tipo) {
    const s = $("ascolto-stato");
    if (!s) return;
    s.textContent = testo || "";
    s.className = "ascolto-stato" + (tipo ? " ascolto-stato--" + tipo : "");
    s.hidden = !testo;
  }

  function aggiornaGriglia() {
    if (cfg && cfg.griglia) cfg.griglia.classList.toggle("con-ascolto", attivo);
  }

  // ---------- Normalizzazione e confronto ----------

  function normalizza(s) {
    return String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function distanza(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2;
    const prec = [];
    for (let j = 0; j <= b.length; j++) prec[j] = j;
    for (let i = 1; i <= a.length; i++) {
      let diag = prec[0];
      prec[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = prec[j];
        prec[j] = Math.min(prec[j] + 1, prec[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
        diag = tmp;
      }
    }
    return prec[b.length];
  }

  // Candidati: le singole parole sentite + le coppie/terne consecutive unite
  // ("ca sa" -> "casa"), utili quando il bambino sillaba.
  function candidati(trascrizione) {
    const tok = normalizza(trascrizione).split(" ").filter(Boolean);
    const out = tok.slice();
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i + n <= tok.length; i++) out.push(tok.slice(i, i + n).join(""));
    }
    return out;
  }

  function cercaParole(trascrizione) {
    if (!cfg) return;
    const norm = cfg.parole.map((p) => normalizza(p.parola));
    const cand = candidati(trascrizione);

    // 1) corrispondenza esatta
    cand.forEach((c) => {
      norm.forEach((n, i) => {
        if (!letta[i] && n === c) segna(i);
      });
    });

    // 2) tolleranza di una lettera, solo per parole di almeno 5 lettere e
    //    solo se la parola simile a schermo e' una sola
    cand.forEach((c) => {
      if (c.length < 5) return;
      const vicine = [];
      norm.forEach((n, i) => {
        if (n.length >= 5 && distanza(c, n) <= 1) vicine.push(i);
      });
      if (vicine.length === 1 && !letta[vicine[0]]) segna(vicine[0]);
    });
  }

  // ---------- Evidenziazione e fine partita ----------

  function segna(i) {
    if (!cfg || letta[i]) return;
    letta[i] = true;
    const tile = cfg.griglia.children[i];
    if (tile) {
      tile.classList.add("parola-tile--letta");
      tile.setAttribute("aria-label", "letta");
    }
    if (!completato && letta.length && letta.every(Boolean)) {
      completato = true;
      const fine = cfg.tutteLette;
      if (typeof fine === "function") fine();
    }
  }

  // ---------- Sintesi vocale (tocco su una parola) ----------

  function fermaVoce() {
    voceId++;
    clearTimeout(voceTimer);
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* ignora */ }
    }
  }

  function dopoVoce(id) {
    if (id !== voceId) return; // e' partita un'altra voce nel frattempo
    clearTimeout(voceTimer);
    voceTimer = setTimeout(() => {
      sospeso = false;
      if (voluto && cfg && attivo && !rec) avviaRiconoscitore();
    }, ATTESA_DOPO_VOCE_MS);
  }

  function pronuncia(testo) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
    // Mentre parla la sintesi, il microfono non deve ascoltarla: lo
    // sospendiamo (altrimenti la parola "letta" dal tablet verrebbe
    // riconosciuta come letta dal bambino).
    sospeso = true;
    if (rec) { try { rec.abort(); } catch (e) { /* ignora */ } }

    const id = ++voceId;
    clearTimeout(voceTimer);
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignora */ }
    const u = new SpeechSynthesisUtterance(testo);
    u.lang = LINGUA;
    u.rate = 0.8;
    try {
      const voci = window.speechSynthesis.getVoices() || [];
      const it = voci.find((v) => /^it([-_]|$)/i.test(v.lang));
      if (it) u.voice = it;
    } catch (e) { /* ignora */ }
    u.onend = () => dopoVoce(id);
    u.onerror = () => dopoVoce(id);
    // rete di sicurezza: alcuni browser non chiamano mai onend
    voceTimer = setTimeout(() => dopoVoce(id), 4000);
    try { window.speechSynthesis.speak(u); } catch (e) { dopoVoce(id); }
  }

  // ---------- Tocchi sulle parole ----------

  function gestisciTocco(e) {
    if (!cfg || !attivo || !cfg.inCorso()) return;
    const tile = e.target.closest ? e.target.closest(".parola-tile") : null;
    if (!tile || !cfg.griglia.contains(tile)) return;
    const i = Array.prototype.indexOf.call(cfg.griglia.children, tile);
    if (i < 0) return;
    const ora = performance.now();

    if (ultimoTocco && ultimoTocco.i === i && ora - ultimoTocco.t < DOPPIO_TOCCO_MS) {
      // doppio tocco: come se la parola fosse stata pronunciata
      clearTimeout(ultimoTocco.timer);
      ultimoTocco = null;
      segna(i);
      return;
    }
    const timer = setTimeout(() => {
      if (ultimoTocco && ultimoTocco.timer === timer) ultimoTocco = null;
      if (cfg && attivo && cfg.inCorso()) pronuncia(cfg.parole[i].parola);
    }, DOPPIO_TOCCO_MS);
    ultimoTocco = { i, t: ora, timer };
  }

  // ---------- Riconoscimento vocale ----------

  function gestisciRisultato(ev) {
    // durante il conto alla rovescia / pausa / sintesi vocale: ignora
    if (!cfg || sospeso || !cfg.inCorso()) return;
    riavviRavvicinati = 0;
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      for (let a = 0; a < res.length; a++) cercaParole(res[a].transcript);
      if (!cfg) return; // la partita puo' essere finita al primo match
    }
  }

  function avviaRiconoscitore() {
    if (!SR || rec || !voluto || !cfg || !attivo) return;
    const r = new SR();
    r.lang = LINGUA;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;

    r.onstart = () => {
      if (rec === r) mostraStato("In ascolto", "attivo");
    };
    r.onresult = gestisciRisultato;
    r.onerror = (e) => {
      const err = e && e.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        voluto = false;
        mostraStato("Microfono non consentito", "errore");
      } else if (err === "audio-capture") {
        voluto = false;
        mostraStato("Microfono non trovato", "errore");
      } else if (err === "language-not-supported") {
        voluto = false;
        mostraStato("Italiano non supportato", "errore");
      } else if (err === "network") {
        riavviRavvicinati += 2;
        mostraStato("Riconoscimento non raggiungibile", "errore");
      }
      // "no-speech" e "aborted" sono normali: si riavvia da onend
    };
    r.onend = () => {
      if (rec === r) rec = null;
      if (!voluto) return;
      if (sospeso) return; // riparte da dopoVoce()
      pianificaRiavvio();
    };

    rec = r;
    ultimoAvvio = Date.now();
    try {
      r.start();
    } catch (e) {
      rec = null;
      mostraStato("Ascolto non disponibile", "errore");
    }
  }

  function pianificaRiavvio() {
    if (Date.now() - ultimoAvvio < 1500) riavviRavvicinati++;
    if (riavviRavvicinati > MAX_RIAVVII_RAVVICINATI) {
      voluto = false;
      mostraStato("Ascolto interrotto", "errore");
      return;
    }
    clearTimeout(riavvioTimer);
    riavvioTimer = setTimeout(() => {
      if (voluto && !sospeso && cfg && attivo && !rec) avviaRiconoscitore();
    }, RITARDO_RIAVVIO_MS);
  }

  function fermaRiconoscitore() {
    voluto = false;
    clearTimeout(riavvioTimer);
    const r = rec;
    rec = null;
    if (r) {
      r.onresult = null;
      r.onend = null;
      r.onerror = null;
      try { r.abort(); } catch (e) { /* ignora */ }
    }
    if (!SR) return;
    const s = $("ascolto-stato");
    // lascia visibili i messaggi di errore, spegne solo "In ascolto"
    if (s && s.classList.contains("ascolto-stato--attivo")) mostraStato("");
  }

  function accendiRiconoscitore() {
    if (!SR || !cfg || !attivo) return;
    voluto = true;
    riavviRavvicinati = 0;
    if (!rec && !sospeso) avviaRiconoscitore();
  }

  // ---------- API per app.js ----------

  const Ascolto = {
    supportato: !!SR,

    /** Partita lanciata dalla home: l'ascolto riparte acceso. */
    nuovoAvvio() {
      attivo = true;
      const inp = $("ascolto-opt");
      if (inp) inp.checked = true;
    },

    /** Schermata di gioco pronta (griglia disegnata, conto alla rovescia in arrivo). */
    apri(c) {
      Ascolto.chiudi();
      const interr = $("ascolto-interruttore");
      if (!c || !c.abilitato) {
        if (interr) interr.hidden = true;
        mostraStato("");
        return;
      }
      cfg = c;
      letta = c.parole.map(() => false);
      completato = false;
      ultimoTocco = null;
      if (interr) interr.hidden = false;
      const inp = $("ascolto-opt");
      if (inp) inp.checked = attivo;
      if (!SR) mostraStato("Voce non supportata da questo browser", "errore");
      else mostraStato("");
      aggiornaGriglia();
      // Parte subito (nello stesso gesto del tocco su Via/Ricomincia, come
      // richiedono alcuni browser); i risultati vengono ignorati finche' il
      // cronometro non e' partito.
      accendiRiconoscitore();
    },

    /** Cronometro partito o ripreso dopo la pausa. */
    riprendi() {
      if (cfg && attivo) accendiRiconoscitore();
    },

    /** Cronometro in pausa. */
    pausa() {
      if (!cfg) return;
      fermaVoce();
      sospeso = false;
      fermaRiconoscitore();
    },

    /** Fine partita o uscita. */
    chiudi() {
      fermaVoce();
      sospeso = false;
      fermaRiconoscitore();
      if (ultimoTocco) { clearTimeout(ultimoTocco.timer); ultimoTocco = null; }
      if (cfg && cfg.griglia) cfg.griglia.classList.remove("con-ascolto");
      cfg = null;
    },
  };

  window.Ascolto = Ascolto;

  // ---------- Collegamenti fissi (una volta sola) ----------

  function init() {
    const griglia = $("parole-griglia");
    if (griglia) griglia.addEventListener("click", gestisciTocco);

    const inp = $("ascolto-opt");
    if (inp) {
      inp.addEventListener("change", () => {
        attivo = inp.checked;
        aggiornaGriglia();
        if (!attivo) {
          fermaVoce();
          sospeso = false;
          fermaRiconoscitore();
          if (ultimoTocco) { clearTimeout(ultimoTocco.timer); ultimoTocco = null; }
        } else if (cfg && !cfg.inPausa()) {
          accendiRiconoscitore();
        }
      });
    }

    // Se la pagina va in secondo piano il microfono si spegne; al ritorno
    // riparte solo se la partita sta ancora correndo.
    document.addEventListener("visibilitychange", () => {
      if (!cfg) return;
      if (document.hidden) {
        fermaVoce();
        sospeso = false;
        fermaRiconoscitore();
      } else if (attivo && cfg.inCorso()) {
        accendiRiconoscitore();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
