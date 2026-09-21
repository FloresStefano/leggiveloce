(function () {
  "use strict";

  const SESSION_LENGTH = 16; // numero di schede per partita
  const CHECK_EVERY = 4;     // ogni quante schede compare la mini-verifica
  const STORAGE_KEY = "leggoATempo:records";

  /** @type {HTMLElement} */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const schermi = {
    home: $("#schermo-home"),
    gioco: $("#schermo-gioco"),
    risultati: $("#schermo-risultati"),
  };

  const el = {
    listaLivelli: $("#lista-livelli"),
    progresso: $("#gioco-progresso"),
    nomeLivello: $("#gioco-nome-livello"),
    timerFill: $("#timer-fill"),
    schedaTesto: $("#scheda-testo"),
    btnPausa: $("#btn-pausa"),
    btnEsci: $("#btn-esci"),
    verificaOverlay: $("#verifica-overlay"),
    verificaDomanda: $("#verifica-domanda"),
    verificaOpzioni: $("#verifica-opzioni"),
    verificaFeedback: $("#verifica-feedback"),
    risultatiStelle: $("#risultati-stelle"),
    risultatiTitolo: $("#risultati-titolo"),
    statParole: $("#stat-parole"),
    statVelocita: $("#stat-velocita"),
    statPrecisione: $("#stat-precisione"),
    btnRigioca: $("#btn-rigioca"),
    btnCambiaLivello: $("#btn-cambia-livello"),
    btnContrasto: $("#btn-contrasto"),
  };

  let state = null;

  function mostraSchermo(nome) {
    Object.values(schermi).forEach((s) => s.classList.remove("attivo"));
    schermi[nome].classList.add("attivo");
  }

  // ---------- Record (localStorage) ----------

  function leggiRecord() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function salvaRecordSeMigliore(levelId, wpm, precisione) {
    const record = leggiRecord();
    const attuale = record[levelId] || { bestWpm: 0, bestPrecisione: 0 };
    const nuovo = {
      bestWpm: Math.max(attuale.bestWpm, wpm),
      bestPrecisione:
        precisione === null
          ? attuale.bestPrecisione
          : Math.max(attuale.bestPrecisione, precisione),
    };
    record[levelId] = nuovo;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (e) {
      /* localStorage non disponibile: si continua senza salvare */
    }
    return nuovo;
  }

  // ---------- Home ----------

  function renderHome() {
    const record = leggiRecord();
    el.listaLivelli.innerHTML = "";
    LEVELS.forEach((livello) => {
      const rec = record[livello.id];
      const btn = document.createElement("button");
      btn.className = "livello-card";
      btn.style.setProperty("--livello-colore", livello.colore);
      btn.innerHTML = `
        <span class="livello-card__emoji">${livello.emoji}</span>
        <span class="livello-card__nome">${livello.nome}</span>
        <span class="livello-card__desc">${livello.descrizione}</span>
        <span class="livello-card__record">${
          rec ? `Record: ${rec.bestWpm} parole/min` : "Nessun record ancora"
        }</span>
      `;
      btn.addEventListener("click", () => avviaLivello(livello.id));
      el.listaLivelli.appendChild(btn);
    });
  }

  // ---------- Utilità ----------

  function mescola(array) {
    const copia = array.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function contaParole(frase) {
    return frase.trim().split(/\s+/).length;
  }

  // ---------- Partita ----------

  function avviaLivello(levelId) {
    const livello = LEVELS.find((l) => l.id === levelId);
    if (!livello) return;

    const deck = mescola(livello.schede).slice(
      0,
      Math.min(SESSION_LENGTH, livello.schede.length)
    );

    state = {
      livello,
      deck,
      indice: 0,
      mostrate: 0,
      dalUltimaVerifica: 0,
      corretti: 0,
      totaleVerifiche: 0,
      inizio: Date.now(),
      pausaInizio: null,
      msInPausa: 0,
      inPausa: false,
    };

    el.nomeLivello.textContent = `${livello.emoji} ${livello.nome}`;
    mostraSchermo("gioco");
    mostraScheda();
  }

  function mostraScheda() {
    const { deck, indice, livello } = state;
    if (indice >= deck.length) {
      terminaPartita();
      return;
    }

    const frase = deck[indice];
    el.schedaTesto.textContent = frase;
    el.progresso.textContent = `Scheda ${indice + 1} di ${deck.length}`;

    el.timerFill.classList.remove("correndo");
    // forza il reflow per poter riavviare l'animazione
    void el.timerFill.offsetWidth;
    el.timerFill.style.animationDuration = livello.displayMs + "ms";
    el.timerFill.classList.add("correndo");

    el.timerFill.addEventListener("animationend", onFineTimer, { once: true });
  }

  function onFineTimer() {
    const { deck, indice } = state;
    const fraseAppenaMostrata = deck[indice];
    state.mostrate += 1;
    state.dalUltimaVerifica += 1;
    state.indice += 1;

    if (state.mostrate >= state.deck.length) {
      terminaPartita();
      return;
    }

    if (state.dalUltimaVerifica >= CHECK_EVERY) {
      state.dalUltimaVerifica = 0;
      mostraVerifica(fraseAppenaMostrata);
    } else {
      mostraScheda();
    }
  }

  function togglePausa() {
    if (!state) return;
    state.inPausa = !state.inPausa;
    if (state.inPausa) {
      state.pausaInizio = Date.now();
      el.timerFill.style.animationPlayState = "paused";
      el.btnPausa.textContent = "▶️";
      el.btnPausa.setAttribute("aria-label", "Riprendi");
    } else {
      state.msInPausa += Date.now() - state.pausaInizio;
      el.timerFill.style.animationPlayState = "running";
      el.btnPausa.textContent = "⏸️";
      el.btnPausa.setAttribute("aria-label", "Pausa");
    }
  }

  function esciDalGioco() {
    state = null;
    renderHome();
    mostraSchermo("home");
  }

  // ---------- Mini-verifica ----------

  function paroleValide(frase) {
    const parole = frase.split(/\s+/).map((p) => p.toLowerCase());
    const filtrate = parole.filter((p) => !PAROLE_FUNZIONE.has(p));
    return filtrate.length ? filtrate : parole;
  }

  function mostraVerifica(frase) {
    const candidate = paroleValide(frase);
    const target = candidate[Math.floor(Math.random() * candidate.length)];

    const tuttiTermini = new Set();
    state.livello.schede.forEach((s) => {
      paroleValide(s).forEach((p) => tuttiTermini.add(p));
    });
    tuttiTermini.delete(target);
    const distrattori = mescola(Array.from(tuttiTermini)).slice(0, 2);

    const opzioni = mescola([target, ...distrattori]);

    el.verificaDomanda.textContent = "Quale parola hai appena letto?";
    el.verificaOpzioni.innerHTML = "";
    el.verificaFeedback.textContent = "";

    opzioni.forEach((opzione) => {
      const btn = document.createElement("button");
      btn.className = "btn-opzione";
      btn.textContent = opzione;
      btn.addEventListener("click", () =>
        valutaRisposta(btn, opzione === target, target)
      );
      el.verificaOpzioni.appendChild(btn);
    });

    el.verificaOverlay.classList.add("attivo");
  }

  function valutaRisposta(bottoneCliccato, corretta, target) {
    state.totaleVerifiche += 1;
    if (corretta) state.corretti += 1;

    $$(".btn-opzione", el.verificaOpzioni).forEach((btn) => {
      btn.disabled = true;
      if (btn.textContent === target) btn.classList.add("corretta");
      else if (btn === bottoneCliccato) btn.classList.add("sbagliata");
    });

    el.verificaFeedback.textContent = corretta
      ? "Bravo! ✅"
      : `Quasi! Era "${target}" 💪`;
    el.verificaFeedback.style.color = corretta ? "#3fb984" : "#e0563f";

    setTimeout(() => {
      el.verificaOverlay.classList.remove("attivo");
      if (state.mostrate >= state.deck.length) {
        terminaPartita();
      } else {
        mostraScheda();
      }
    }, 1100);
  }

  // ---------- Risultati ----------

  function terminaPartita() {
    const elapsedMs =
      Date.now() - state.inizio - state.msInPausa - (state.inPausa ? Date.now() - state.pausaInizio : 0);
    const paroleTotali = state.deck
      .slice(0, state.mostrate)
      .reduce((tot, frase) => tot + contaParole(frase), 0);

    const minuti = Math.max(elapsedMs / 60000, 0.05);
    const wpm = Math.round(paroleTotali / minuti);
    const precisione = state.totaleVerifiche
      ? Math.round((state.corretti / state.totaleVerifiche) * 100)
      : null;

    salvaRecordSeMigliore(state.livello.id, wpm, precisione);

    const stelle = calcolaStelle(precisione);
    el.risultatiStelle.textContent = "⭐".repeat(stelle) + "☆".repeat(3 - stelle);
    el.risultatiTitolo.textContent = `Hai completato "${state.livello.nome}"!`;
    el.statParole.textContent = paroleTotali;
    el.statVelocita.textContent = `${wpm}`;
    el.statPrecisione.textContent =
      precisione === null ? "–" : `${precisione}%`;

    mostraSchermo("risultati");
  }

  function calcolaStelle(precisione) {
    if (precisione === null) return 2;
    if (precisione >= 80) return 3;
    if (precisione >= 50) return 2;
    return 1;
  }

  // ---------- Alto contrasto ----------

  function applicaContrasto(attivo) {
    document.documentElement.dataset.contrast = attivo ? "alto" : "";
    el.btnContrasto.setAttribute("aria-pressed", String(attivo));
    try {
      localStorage.setItem("leggoATempo:contrasto", attivo ? "1" : "0");
    } catch (e) {
      /* ignora */
    }
  }

  // ---------- Avvio ----------

  function init() {
    renderHome();
    mostraSchermo("home");

    el.btnPausa.addEventListener("click", togglePausa);
    el.btnEsci.addEventListener("click", esciDalGioco);
    el.btnRigioca.addEventListener("click", () => avviaLivello(state.livello.id));
    el.btnCambiaLivello.addEventListener("click", () => {
      state = null;
      renderHome();
      mostraSchermo("home");
    });
    el.btnContrasto.addEventListener("click", () => {
      const attivo = document.documentElement.dataset.contrast !== "alto";
      applicaContrasto(attivo);
    });

    let contrastoSalvato = "0";
    try {
      contrastoSalvato = localStorage.getItem("leggoATempo:contrasto") || "0";
    } catch (e) {
      /* ignora */
    }
    applicaContrasto(contrastoSalvato === "1");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
