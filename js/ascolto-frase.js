/*
 * AscoltoFrase: ascolta il microfono finche' il bambino non pronuncia, per
 * intero, una frase attesa. Serve al Gioco 7 (Somme col riporto): dopo aver
 * sistemato i bastoncini, il bambino deve dire
 *
 *     "sette piu' cinque uguale dodici"
 *
 * cioe' primo numero, operatore, secondo numero, uguaglianza, risultato.
 *
 * Cosa conta come frase giusta (tutto quello che il bambino dice prima e dopo
 * viene ignorato, quindi puo' ripetere pezzetti, sbagliare e ricominciare):
 *   - numeri a parole ("sette") o a cifre ("7"), il riconoscitore usa spesso le cifre;
 *   - operatore: "piu'" o "+";
 *   - uguaglianza: "uguale", "uguale a", "e' uguale a", "fa", "fanno" o "=";
 *   - i cinque pezzi devono essere di seguito e nell'ordine giusto: la frase
 *     viene cercata in TUTTO quello che e' stato sentito (anche a cavallo di
 *     due pause), in tutte le alternative proposte dal riconoscitore.
 *
 * Usa la Web Speech API del browser (it-IT): come per gli altri giochi
 * l'audio e' elaborato dal servizio del browser (Google su Chrome, Apple su
 * Safari); l'app non salva nulla.
 *
 *   AscoltoFrase.supportato
 *   AscoltoFrase.bersaglio(a, b)      -> ["#7", "+", "#5", "=", "#12"]
 *   AscoltoFrase.avvia({ bersaglio, onTesto, onTrovata, onErrore, onStato })
 *   AscoltoFrase.ferma()
 *
 * Seconda modalita' (Gioco 8, Tabelline): piu' frasi attese insieme, in
 * qualsiasi ordine. Si passa "bersagli" (invece di "bersaglio"):
 *   AscoltoFrase.bersagliMoltiplicazione(a, b)  -> varianti ["#3","*","#4","=","#12"] e ["#3","*","#4","#12"]
 *   AscoltoFrase.avvia({ bersagli: [{ id, varianti: [...] }], inCorso, onTesto, onTrovata(id), ... })
 * onTrovata(id) arriva una volta per ogni frase la prima volta che e' completa;
 * "inCorso()" (facoltativa) dice se il gioco sta ascoltando: finche' risponde
 * false (conto alla rovescia) quello che si sente viene scartato.
 * Operatore per: "per", "x", "volte", "*", "×"; "uguale" e' facoltativo.
 *
 * onTesto({ parole: [{ testo, stato }], parziale })  a ogni risultato; stato e'
 *     "ok" (parola della frase giusta gia' pronunciata), "parz" (pezzo giusto
 *     ma frase non ancora completa) oppure "" ; sono solo le ultime parole.
 * onTrovata()           frase completa e giusta: il microfono e' gia' spento.
 * onErrore(tipo)        "negato" | "assente" | "lingua" | "interrotto": il
 *                       microfono non e' utilizzabile, il gioco puo' ripiegare.
 * onStato(testo, tipo)  messaggi brevi ("In ascolto").
 */
(function () {
  "use strict";

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const LINGUA = "it-IT";
  const RITARDO_RIAVVIO_MS = 250;
  const MAX_RIAVVII_RAVVICINATI = 5;
  const MAX_PAROLE_STORICO = 80; // quanto "passato" si tiene tra un riavvio e l'altro
  const PAROLE_MOSTRATE = 12;

  const NUMERI = {
    zero: 0, uno: 1, un: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7,
    otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14,
    quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20,
  };
  // Fino a 90 (serve alle tabelline): venti, ventuno ... novantanove.
  (function () {
    const decine = { venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90 };
    const unita = ["", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove"];
    Object.keys(decine).forEach((d) => {
      NUMERI[d] = decine[d];
      for (let u = 1; u <= 9; u++) {
        const base = u === 1 || u === 8 ? d.slice(0, -1) : d; // ventuno, ventotto
        NUMERI[base + unita[u]] = decine[d] + u;
      }
    });
  })();
  const UGUALE = new Set(["uguale", "uguali", "fa", "fanno"]);

  // ---------- Analisi del testo (pura, senza DOM) ----------

  // "7+5=12" -> ["7", "+", "5", "=", "12"]; "Sette PIÙ cinque" -> ["sette", "più", "cinque"]
  // (le parole restano con gli accenti, per mostrarle; il confronto li toglie).
  function parole(testo) {
    const s = String(testo)
      .toLowerCase()
      .replace(/\+/g, " + ")
      .replace(/=/g, " = ")
      .replace(/[×*]/g, " * ")
      .replace(/(\d+)/g, " $1 ")
      .replace(/[^a-z0-9+=*àèéìòù\s]/g, " ");
    return s.split(/\s+/).filter(Boolean);
  }

  function senzaAccenti(w) {
    return w.normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function canonica(w) {
    if (/^\d+$/.test(w)) return "#" + parseInt(w, 10);
    if (Object.prototype.hasOwnProperty.call(NUMERI, w)) return "#" + NUMERI[w];
    if (w === "+" || w === "piu") return "+";
    if (w === "*" || w === "x" || w === "per" || w === "volte") return "*";
    if (w === "=" || UGUALE.has(w)) return "=";
    return w;
  }

  // Elenco di { testo, c, ign }: "ign" per le parolette che non rompono la
  // frase ("uguale A dodici", "E' uguale a dodici").
  function analizza(testo) {
    const voci = parole(testo).map((w) => ({ testo: w, c: canonica(senzaAccenti(w)), ign: false }));
    // "venti quattro" detto in due parole vale 24
    for (let i = 0; i + 1 < voci.length; i++) {
      const x = /^#(\d+)$/.exec(voci[i].c);
      const y = /^#(\d+)$/.exec(voci[i + 1].c);
      // ...ma non se la seconda cifra e' l'inizio dell'operazione dopo
      // ("cinquanta" + "tre per quattro" non e' 53)
      const prossima = voci[i + 2] ? voci[i + 2].c : "";
      if (x && y && prossima !== "*" && prossima !== "+" && +x[1] >= 20 && +x[1] % 10 === 0 && +y[1] >= 1 && +y[1] <= 9) {
        voci[i].c = "#" + (+x[1] + +y[1]);
        voci[i + 1].ign = true;
      }
    }
    for (let i = 0; i < voci.length; i++) {
      if (voci[i].c === "a" && i > 0 && voci[i - 1].c === "=") voci[i].ign = true;
      if (voci[i].c === "e" && i + 1 < voci.length && voci[i + 1].c === "=") voci[i].ign = true;
    }
    return voci;
  }

  // Cerca la frase (bersaglio) di seguito dentro le voci. Restituisce
  // { trovata, da, a, parziale }: da/a sono indici in "voci" della miglior
  // corrispondenza (completa se trovata, altrimenti la piu' lunga che parte
  // dall'inizio della frase; piu' recente a parita' di lunghezza).
  function cerca(voci, bersaglio) {
    const idx = [];
    voci.forEach((v, i) => { if (!v.ign) idx.push(i); });
    let migliore = { trovata: false, da: -1, a: -1, parziale: 0 };
    for (let s = 0; s < idx.length; s++) {
      let k = 0;
      while (k < bersaglio.length && s + k < idx.length && voci[idx[s + k]].c === bersaglio[k]) k++;
      if (k === bersaglio.length) return { trovata: true, da: idx[s], a: idx[s + k - 1], parziale: k };
      if (k >= 1 && k >= migliore.parziale) migliore = { trovata: false, da: idx[s], a: idx[s + k - 1], parziale: k };
    }
    return migliore;
  }

  function bersaglio(a, b) {
    return ["#" + a, "+", "#" + b, "=", "#" + (a + b)];
  }

  // "tre per quattro uguale dodici" oppure "tre per quattro dodici" (senza "uguale").
  function bersagliMoltiplicazione(a, b) {
    return [
      ["#" + a, "*", "#" + b, "=", "#" + a * b],
      ["#" + a, "*", "#" + b, "#" + a * b],
    ];
  }

  // Tutte le occorrenze complete di una frase dentro le voci: [{ da, a }].
  function occorrenzeComplete(voci, frase) {
    const idx = [];
    voci.forEach((v, i) => { if (!v.ign) idx.push(i); });
    const out = [];
    for (let s = 0; s + frase.length <= idx.length; s++) {
      let k = 0;
      while (k < frase.length && voci[idx[s + k]].c === frase[k]) k++;
      if (k === frase.length) out.push({ da: idx[s], a: idx[s + k - 1] });
    }
    return out;
  }

  // Quante delle ultime parole sono l'inizio (non ancora completo) di una delle frasi.
  function codaParziale(voci, frasi) {
    const idx = [];
    voci.forEach((v, i) => { if (!v.ign) idx.push(i); });
    let migliore = 0;
    frasi.forEach((f) => {
      for (let k = Math.min(f.length - 1, idx.length); k >= 1; k--) {
        let ok = true;
        for (let j = 0; j < k; j++) {
          if (voci[idx[idx.length - k + j]].c !== f[j]) { ok = false; break; }
        }
        if (ok) { if (k > migliore) migliore = k; break; }
      }
    });
    return migliore ? { da: idx[idx.length - migliore], a: idx[idx.length - 1], k: migliore } : null;
  }

  // ---------- Riconoscimento ----------

  let cfg = null;
  let voluto = false;
  let rec = null;
  let generazione = 0;
  let storico = []; // testi (prima alternativa) dei segmenti di istanze precedenti
  let segmenti = []; // segmenti dell'istanza corrente: [{ alt: [..], finale }]
  let riavvioTimer = null;
  let ultimoAvvio = 0;
  let riavviRavvicinati = 0;
  let trovata = false;
  let trovati = new Set(); // modalita' a piu' frasi: id gia' riconosciuti
  let salta = 0; // risultati da ignorare (detti durante il conto alla rovescia)
  let saltaGen = -1;
  let bloccato = false; // il microfono non e' utilizzabile: non riprovare al ritorno sulla pagina

  function stato(testo, tipo) {
    if (cfg && typeof cfg.onStato === "function") cfg.onStato(testo, tipo);
  }

  function errore(tipo, messaggio) {
    voluto = false;
    bloccato = true;
    stato(messaggio, "errore");
    if (cfg && typeof cfg.onErrore === "function") cfg.onErrore(tipo);
  }

  // Tutte le "letture" possibili di quello che e' stato detto: quella con la
  // prima alternativa di ogni segmento, piu' una per ogni alternativa diversa
  // di ciascun segmento (alle altre alternative si cambia un segmento alla volta).
  function sequenze() {
    const passato = storico.join(" ");
    const base = segmenti.map((s) => s.alt[0] || "");
    const out = [[passato].concat(base).join(" ")];
    segmenti.forEach((s, i) => {
      for (let k = 1; k < s.alt.length; k++) {
        const copia = base.slice();
        copia[i] = s.alt[k];
        out.push([passato].concat(copia).join(" "));
      }
    });
    return out;
  }

  // Modalita' a piu' frasi (Tabelline).
  function valutaMulti() {
    const seq = sequenze();
    const nuovi = [];
    let base = null;
    for (let i = 0; i < seq.length; i++) {
      const voci = analizza(seq[i]);
      if (i === 0) base = voci;
      cfg.bersagli.forEach((b) => {
        if (trovati.has(b.id) || nuovi.indexOf(b.id) >= 0) return;
        if (b.varianti.some((f) => occorrenzeComplete(voci, f).length > 0)) nuovi.push(b.id);
      });
    }
    if (!base) return;

    // si mostrano le ultime parole: in verde le frasi complete, in giallo la
    // frase che si sta dicendo adesso
    const stati = base.map(() => "");
    cfg.bersagli.forEach((b) => {
      b.varianti.forEach((f) => {
        occorrenzeComplete(base, f).forEach((o) => { for (let i = o.da; i <= o.a; i++) stati[i] = "ok"; });
      });
    });
    const parz = codaParziale(base, [].concat(...cfg.bersagli.filter((b) => !trovati.has(b.id) && nuovi.indexOf(b.id) < 0).map((b) => b.varianti)));
    if (parz) for (let i = parz.da; i <= parz.a; i++) if (!stati[i]) stati[i] = "parz";
    const inizio = Math.max(0, base.length - PAROLE_MOSTRATE);
    const mostrate = [];
    for (let i = inizio; i < base.length; i++) mostrate.push({ testo: base[i].testo, stato: stati[i] });
    if (typeof cfg.onTesto === "function") cfg.onTesto({ parole: mostrate, parziale: parz ? parz.k : 0 });

    for (let n = 0; n < nuovi.length; n++) {
      if (!cfg) return; // la partita puo' essere finita con una frase precedente
      trovati.add(nuovi[n]);
      if (typeof cfg.onTrovata === "function") cfg.onTrovata(nuovi[n]);
    }
  }

  function valuta() {
    if (!cfg || trovata) return;
    if (cfg.bersagli) { valutaMulti(); return; }
    const seq = sequenze();
    let scelta = null;
    let voci = null;
    for (let i = 0; i < seq.length; i++) {
      const v = analizza(seq[i]);
      const r = cerca(v, cfg.bersaglio);
      if (r.trovata) { scelta = r; voci = v; break; }
      if (i === 0) { scelta = r; voci = v; }
    }
    if (!voci) return;

    // ultime parole da mostrare, con quelle della frase evidenziate
    const inizio = Math.max(0, voci.length - PAROLE_MOSTRATE);
    const mostrate = [];
    for (let i = inizio; i < voci.length; i++) {
      const dentro = scelta && scelta.parziale > 0 && i >= scelta.da && i <= scelta.a;
      mostrate.push({ testo: voci[i].testo, stato: dentro ? (scelta.trovata ? "ok" : "parz") : "" });
    }
    if (typeof cfg.onTesto === "function") cfg.onTesto({ parole: mostrate, parziale: scelta ? scelta.parziale : 0 });

    if (scelta && scelta.trovata) {
      trovata = true;
      const fine = cfg.onTrovata;
      AscoltoFrase.ferma();
      if (typeof fine === "function") fine();
    }
  }

  function gestisciRisultato(ev, gen) {
    if (!cfg || gen !== generazione) return;
    riavviRavvicinati = 0;
    if (typeof cfg.inCorso === "function" && !cfg.inCorso()) {
      // conto alla rovescia: quello che si sente non vale
      salta = ev.results.length;
      saltaGen = gen;
      segmenti = [];
      return;
    }
    segmenti = [];
    for (let i = saltaGen === gen ? salta : 0; i < ev.results.length; i++) {
      const res = ev.results[i];
      const alt = [];
      for (let a = 0; a < res.length; a++) alt.push(res[a].transcript);
      segmenti.push({ alt, finale: !!res.isFinal });
    }
    valuta();
  }

  // I segmenti dell'istanza che si chiude passano nel "passato" (solo testo).
  function archivia() {
    segmenti.forEach((s) => { if (s.alt[0]) storico.push(s.alt[0]); });
    segmenti = [];
    let tutte = storico.join(" ").split(/\s+/).filter(Boolean);
    if (tutte.length > MAX_PAROLE_STORICO) {
      tutte = tutte.slice(tutte.length - MAX_PAROLE_STORICO);
      storico = [tutte.join(" ")];
    }
  }

  function avviaRiconoscitore() {
    if (!SR || rec || !voluto || !cfg) return;
    const r = new SR();
    const gen = ++generazione;
    r.lang = LINGUA;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;

    r.onstart = () => { if (rec === r) stato("In ascolto", "attivo"); };
    r.onresult = (ev) => gestisciRisultato(ev, gen);
    r.onerror = (e) => {
      const err = e && e.error;
      if (err === "not-allowed" || err === "service-not-allowed") errore("negato", "Microfono non consentito");
      else if (err === "audio-capture") errore("assente", "Microfono non trovato");
      else if (err === "language-not-supported") errore("lingua", "Italiano non supportato");
      else if (err === "network") riavviRavvicinati += 2;
      // "no-speech" e "aborted" sono normali: si riavvia da onend
    };
    r.onend = () => {
      if (rec === r) rec = null;
      archivia();
      if (!voluto || !cfg) return;
      if (Date.now() - ultimoAvvio < 1500) riavviRavvicinati++;
      if (riavviRavvicinati > MAX_RIAVVII_RAVVICINATI) {
        errore("interrotto", "Ascolto interrotto");
        return;
      }
      clearTimeout(riavvioTimer);
      riavvioTimer = setTimeout(() => { if (voluto && cfg && !rec) avviaRiconoscitore(); }, RITARDO_RIAVVIO_MS);
    };

    rec = r;
    ultimoAvvio = Date.now();
    try {
      r.start();
    } catch (e) {
      rec = null;
      errore("interrotto", "Ascolto non disponibile");
    }
  }

  const AscoltoFrase = {
    supportato: !!SR,
    bersaglio,
    bersagliMoltiplicazione,

    /** Parte l'ascolto. Va chiamato dentro un tocco/click (come richiedono alcuni browser). */
    avvia(c) {
      AscoltoFrase.ferma();
      cfg = c;
      storico = [];
      segmenti = [];
      trovata = false;
      trovati = new Set();
      salta = 0;
      saltaGen = -1;
      bloccato = false;
      riavviRavvicinati = 0;
      voluto = true;
      if (typeof c.onTesto === "function") c.onTesto({ parole: [], parziale: 0 });
      avviaRiconoscitore();
    },

    ferma() {
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
      cfg = null;
    },

    // per i test
    _analizza: analizza,
    _cerca: cerca,
  };

  window.AscoltoFrase = AscoltoFrase;

  // Pagina in secondo piano: il microfono si spegne; al ritorno riparte.
  document.addEventListener("visibilitychange", () => {
    if (!cfg || bloccato) return;
    if (document.hidden) {
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
      archivia();
    } else {
      voluto = true;
      riavviRavvicinati = 0;
      avviaRiconoscitore();
    }
  });
})();
