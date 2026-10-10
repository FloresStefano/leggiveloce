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
 * Due modalita' (cfg.modo):
 *
 * - "lettura" (Gioco 1 Bisillabe, Gioco 3 Trisillabe, Gioco 4 Leggi una frase):
 *   ascolta il microfono e, quando riconosce una delle parole a schermo, la
 *   evidenzia (classe .parola-tile--letta). Un tocco su una parola la
 *   pronuncia (sintesi vocale), un doppio tocco la evidenzia come se fosse
 *   stata letta. Quando tutte sono evidenziate chiama cfg.tutteLette(), che
 *   nel gioco equivale a premere FINE. Se una parola compare piu' volte nella
 *   stessa frase ("il", "la"...) va detta altrettante volte.
 *
 * - "selezione" (Gioco 5 Parola a fette, Gioco 6 Lettere speculari): ogni parola riconosciuta tra quelle
 *   della griglia equivale a toccarla a mano: chiama cfg.alTrovata(indice) e
 *   sta al gioco decidere se e' giusta o sbagliata. Niente tocchi speciali.
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

  // Dove stanno interruttore e messaggio di stato in ciascuna schermata.
  const SLOT = {
    gioco: { interr: "ascolto-interruttore", inp: "ascolto-opt", stato: "ascolto-stato" },
    fette: { interr: "fette-ascolto-interruttore", inp: "fette-ascolto-opt", stato: "fette-ascolto-stato" },
    lettere: { interr: "lettere-ascolto-interruttore", inp: "lettere-ascolto-opt", stato: "lettere-ascolto-stato" },
  };

  let slot = SLOT.gioco;
  let cfg = null; // { modo, schermo, griglia, parole, inCorso(), inPausa(), tutteLette(), alTrovata(i) }
  let letta = []; // modo "lettura": letta[i] === true se la parola i e' evidenziata
  let attivo = true; // stato dell'interruttore "🎤 Ascolto"
  let voluto = false; // vogliamo che il microfono sia acceso
  let sospeso = false; // in pausa temporanea (mentre parla la sintesi vocale)
  let rec = null; // riconoscitore corrente
  let generazione = 0; // numera i riconoscitori (gli indici dei risultati ripartono da 0)
  let segmenti = {}; // per ogni segmento di voce, quante volte e' gia' stata contata ogni parola
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
    const s = $(slot.stato);
    if (!s) return;
    s.textContent = testo || "";
    s.className = "ascolto-stato" + (tipo ? " ascolto-stato--" + tipo : "");
    s.hidden = !testo;
  }

  function sincronizzaInterruttori() {
    Object.keys(SLOT).forEach((k) => {
      const inp = $(SLOT[k].inp);
      if (inp) inp.checked = attivo;
    });
  }

  function aggiornaGriglia() {
    if (cfg && cfg.modo === "lettura" && cfg.griglia) cfg.griglia.classList.toggle("con-ascolto", attivo);
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
      for (let i = 0; i + n <= tok.length; i++) {
        const unita = tok.slice(i, i + n).join("");
        if (unita.length >= 3) out.push(unita);
      }
    }
    return out;
  }

  // Quante volte compare ciascuna parola a schermo in una trascrizione
  // (per ogni parola si prende il massimo tra le alternative proposte dal
  // riconoscitore). Corrispondenza esatta; in piu' tolleranza di una lettera
  // solo per parole di almeno 5 lettere e solo se a schermo ce n'e' una sola
  // cosi' simile.
  function occorrenze(alternative, norm) {
    const out = new Map();
    const distinte = Array.from(new Set(norm));
    alternative.forEach((tr) => {
      const parziale = new Map();
      candidati(tr).forEach((c) => {
        if (distinte.indexOf(c) >= 0) {
          parziale.set(c, (parziale.get(c) || 0) + 1);
        } else if (c.length >= 5) {
          const vicine = distinte.filter((n) => n.length >= 5 && distanza(c, n) <= 1);
          if (vicine.length === 1) parziale.set(vicine[0], Math.max(parziale.get(vicine[0]) || 0, 1));
        }
      });
      parziale.forEach((n, w) => {
        if (n > (out.get(w) || 0)) out.set(w, n);
      });
    });
    return out;
  }

  // Riconoscimento "a flusso": lo stesso segmento di voce viene riconsegnato
  // piu' volte man mano che si allunga. Si agisce solo sulle occorrenze in piu'
  // rispetto a quelle gia' contate per quel segmento.
  function applicaOccorrenze(occ, chiaveSegmento) {
    const reg = segmenti[chiaveSegmento] || (segmenti[chiaveSegmento] = new Map());
    occ.forEach((n, w) => {
      const prima = reg.get(w) || 0;
      if (n <= prima) return;
      reg.set(w, n);
      for (let k = 0; k < n - prima; k++) parolaSentita(w);
    });
  }

  function parolaSentita(w) {
    if (!cfg) return;
    const norm = cfg.parole.map((p) => normalizza(p.parola));
    if (cfg.modo === "selezione") {
      const i = norm.indexOf(w);
      if (i >= 0 && typeof cfg.alTrovata === "function") cfg.alTrovata(i);
      return;
    }
    const i = norm.findIndex((n, j) => n === w && !letta[j]);
    if (i >= 0) segna(i);
  }

  // ---------- Evidenziazione e fine partita (modo "lettura") ----------

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

  // ---------- Tocchi sulle parole (modo "lettura") ----------

  function gestisciTocco(e) {
    if (!cfg || cfg.modo !== "lettura" || !attivo || !cfg.inCorso()) return;
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

  function gestisciRisultato(ev, gen) {
    // durante il conto alla rovescia / pausa / sintesi vocale: ignora
    if (!cfg || sospeso || !cfg.inCorso()) return;
    riavviRavvicinati = 0;
    const norm = cfg.parole.map((p) => normalizza(p.parola));
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const alternative = [];
      for (let a = 0; a < res.length; a++) alternative.push(res[a].transcript);
      applicaOccorrenze(occorrenze(alternative, norm), gen + ":" + i);
      if (!cfg) return; // la partita puo' essere finita al primo match
    }
  }

  function avviaRiconoscitore() {
    if (!SR || rec || !voluto || !cfg || !attivo) return;
    const r = new SR();
    const gen = ++generazione;
    r.lang = LINGUA;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;

    r.onstart = () => {
      if (rec === r) mostraStato("In ascolto", "attivo");
    };
    r.onresult = (ev) => gestisciRisultato(ev, gen);
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
    const s = $(slot.stato);
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
      sincronizzaInterruttori();
    },

    /** Schermata di gioco pronta (griglia disegnata, conto alla rovescia in arrivo). */
    apri(c) {
      Ascolto.chiudi();
      slot = SLOT[(c && c.schermo) || "gioco"] || SLOT.gioco;
      const interr = $(slot.interr);
      if (!c || !c.abilitato) {
        if (interr) interr.hidden = true;
        mostraStato("");
        return;
      }
      cfg = Object.assign({ modo: "lettura" }, c);
      letta = c.parole.map(() => false);
      segmenti = {};
      completato = false;
      ultimoTocco = null;
      if (interr) interr.hidden = false;
      sincronizzaInterruttori();
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

  function cambioInterruttore(inp) {
    attivo = inp.checked;
    sincronizzaInterruttori();
    aggiornaGriglia();
    if (!attivo) {
      fermaVoce();
      sospeso = false;
      fermaRiconoscitore();
      if (ultimoTocco) { clearTimeout(ultimoTocco.timer); ultimoTocco = null; }
    } else if (cfg && !cfg.inPausa()) {
      accendiRiconoscitore();
    }
  }

  function init() {
    const griglia = $("parole-griglia");
    if (griglia) griglia.addEventListener("click", gestisciTocco);

    Object.keys(SLOT).forEach((k) => {
      const inp = $(SLOT[k].inp);
      if (inp) inp.addEventListener("change", () => cambioInterruttore(inp));
    });

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
