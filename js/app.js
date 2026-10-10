(function () {
  "use strict";

  const PAROLE_PER_PARTITA_LETTURA = 10;
  const PAROLE_PER_PARTITA_ABBINAMENTO = 8;
  const STORAGE_FRASI_RECENTI = "leggoATempo:frasiRecenti";
  // Una frase gia' giocata non puo' riuscire prima che siano passate almeno
  // 20 giocate diverse (la memoria resta anche se si chiude/riapre l'app).
  const FRASI_RECENTI_DA_EVITARE = 20;
  const COUNTDOWN_STEPS = ["3", "2", "1", "VIA!"];
  const COUNTDOWN_STEP_MS = 700;

  // Collega ogni gioco attivo al proprio elenco di parole.
  // Gioco 5 e Gioco 6 sono uniformati allo stesso obiettivo: 5 parole da
  // trovare per categoria (non piu' 7 per "fette" e 6 per "lettere").
  const PAROLE_PER_PARTITA_FETTE = 5;
  const LETTERE_SPECULARI = ["b", "d", "p", "q"];
  const PAROLE_PER_LETTERA = 5;

  const GAME_DATA = {
    "bisillabe-piane-semplici": PAROLE_BISILLABE_PIANE,
    "combina-bisillabe": PAROLE_BISILLABE_PIANE,
    "trisillabe-piane": PAROLE_TRISILLABE_PIANE,
    "leggi-frase": FRASI,
    "parola-a-fette": PAROLE_A_FETTE,
    "lettere-speculari": PAROLE_LETTERE_SPECULARI,
  };

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const schermi = {
    home: $("#schermo-home"),
    gioco: $("#schermo-gioco"),
    abbina: $("#schermo-abbina"),
    fette: $("#schermo-fette"),
    lettere: $("#schermo-lettere"),
    riporto: $("#schermo-riporto"),
  };

  const el = {
    // home
    listaGiochi: $("#lista-giochi"),
    // gioco 1: lettura a tempo
    nomeGioco: $("#gioco-titolo"),
    cronometro: $("#cronometro"),
    paroleGriglia: $("#parole-griglia"),
    countdownOverlay: $("#countdown-overlay"),
    countdownTesto: $("#countdown-testo"),
    btnPausa: $("#btn-pausa"),
    btnRicomincia: $("#btn-ricomincia"),
    btnNuovaSfida: $("#btn-nuova-sfida"),
    btnFine: $("#btn-fine"),
    btnEsci: $("#btn-esci"),
    // gioco 2: combina bisillabe
    abbinaCronometro: $("#abbina-cronometro"),
    abbinaSinistra: $("#abbina-sinistra"),
    abbinaDestra: $("#abbina-destra"),
    abbinaMessaggio: $("#abbina-messaggio"),
    abbinaBtnRicomincia: $("#abbina-btn-ricomincia"),
    abbinaBtnNuovaSfida: $("#abbina-btn-nuova-sfida"),
    abbinaBtnEsci: $("#abbina-btn-esci"),
    // gioco 5: parola a fette
    fetteCronometro: $("#fette-cronometro"),
    fetteContenuto: $("#fette-contenuto"),
    fetteParolaTile: $("#fette-parola-tile"),
    fetteSillabeScelta: $("#fette-sillabe-scelta"),
    fetteParoleGriglia: $("#fette-parole-griglia"),
    fetteCountdownOverlay: $("#fette-countdown-overlay"),
    fetteCountdownTesto: $("#fette-countdown-testo"),
    fetteMessaggio: $("#fette-messaggio"),
    fetteBtnRicomincia: $("#fette-btn-ricomincia"),
    fetteBtnNuovaSfida: $("#fette-btn-nuova-sfida"),
    fetteBtnEsci: $("#fette-btn-esci"),
    // gioco 6: lettere speculari
    lettereCronometro: $("#lettere-cronometro"),
    lettereContenuto: $("#lettere-contenuto"),
    lettereScelta: $("#lettere-scelta"),
    lettereGriglia: $("#lettere-griglia"),
    lettereCountdownOverlay: $("#lettere-countdown-overlay"),
    lettereCountdownTesto: $("#lettere-countdown-testo"),
    lettereMessaggio: $("#lettere-messaggio"),
    lettereBtnRicomincia: $("#lettere-btn-ricomincia"),
    lettereBtnNuovaSfida: $("#lettere-btn-nuova-sfida"),
    lettereBtnEsci: $("#lettere-btn-esci"),
    // gioco 7: somme col riporto
    riportoCronometro: $("#riporto-cronometro"),
    riportoContenuto: $("#riporto-contenuto"),
    riportoSomma: $("#riporto-somma"),
    riportoMessaggio: $("#riporto-messaggio"),
    riportoPezziFuori: $("#riporto-pezzi-fuori"),
    riportoPezziScatola: $("#riporto-pezzi-scatola"),
    riportoPezziRiporto: $("#riporto-pezzi-riporto"),
    riportoContatoreScatola: $("#riporto-contatore-scatola"),
    riportoContatoreRiporto: $("#riporto-contatore-riporto"),
    riportoEsce: $("#riporto-esce"),
    riportoNumeriScatola: $("#riporto-numeri-scatola"),
    riportoNumeriRiporto: $("#riporto-numeri-riporto"),
    riportoRisposteCard: $("#riporto-risposte-card"),
    riportoDomanda: $("#riporto-domanda"),
    riportoRisposte: $("#riporto-risposte"),
    riportoAscoltoStato: $("#riporto-ascolto-stato"),
    riportoSentito: $("#riporto-sentito"),
    riportoOptNumeri: $("#riporto-opt-numeri"),
    riportoCountdownOverlay: $("#riporto-countdown-overlay"),
    riportoCountdownTesto: $("#riporto-countdown-testo"),
    riportoBtnRicomincia: $("#riporto-btn-ricomincia"),
    riportoBtnNuovaSfida: $("#riporto-btn-nuova-sfida"),
    riportoBtnControlla: $("#riporto-btn-controlla"),
    riportoBtnEsci: $("#riporto-btn-esci"),
    // home: giocatore e stelline
    homeUtente: $("#home-utente"),
    homeAvatar: $("#home-avatar"),
    homeStelle: $("#home-stelle"),
    homeStelleTotali: $("#home-stelle-totali"),
  };

  /** Stato della partita in corso (gioco 1 o gioco 2) */
  let stato = null;
  let timerIntervalId = null;

  function mostraSchermo(nome) {
    Object.values(schermi).forEach((s) => s.classList.remove("attivo"));
    schermi[nome].classList.add("attivo");
  }

  function mescola(array) {
    const copia = array.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Formattazione tempo ----------

  function formattaTempo(ms) {
    const totaliSecondi = ms / 1000;
    if (totaliSecondi < 60) {
      return `${totaliSecondi.toFixed(1)}s`;
    }
    const minuti = Math.floor(totaliSecondi / 60);
    const secondi = (totaliSecondi % 60).toFixed(1).padStart(4, "0");
    return `${minuti}:${secondi}`;
  }

  // ---------- Home ----------

  function renderHome() {
    renderGiocatore();
    el.listaGiochi.innerHTML = "";
    GAMES.forEach((gioco) => {
      const card = document.createElement("div");
      card.className = "gioco-card" + (gioco.attivo ? "" : " gioco-card--disabilitato");
      card.style.setProperty("--gioco-colore", gioco.colore);

      // Stelline accumulate in questo gioco (immagine + numero a fianco).
      const stelleHtml = gioco.attivo
        ? `<span class="gioco-card__stelle" title="Stelline guadagnate in questo gioco" aria-label="${window.Giocatore.stelleGioco(
            gioco.id
          )} stelline in questo gioco"><img src="img/stella.svg" alt="" width="30" height="30" draggable="false" /><span class="gioco-card__stelle-numero">${window.Giocatore.stelleGioco(
            gioco.id
          )}</span></span>`
        : "";

      card.innerHTML = `
        <button class="gioco-card__avvia" ${gioco.attivo ? "" : "disabled"}>
          <span class="gioco-card__emoji">${gioco.emoji}</span>
          <span class="gioco-card__titolo">${gioco.titolo}</span>
          <span class="gioco-card__desc">${gioco.descrizione}</span>
        </button>
        ${stelleHtml}
      `;

      if (gioco.attivo) {
        $(".gioco-card__avvia", card).addEventListener("click", () =>
          avviaGiocoDaHome(gioco.id)
        );
      }

      el.listaGiochi.appendChild(card);
    });
  }

  // Giocatore della sessione (avatar; il soprannome non si mostra, c'e' solo "Ciao!") e contatore globale.
  function renderGiocatore() {
    const G = window.Giocatore;
    el.homeAvatar.src = G.avatarSrc();
    el.homeStelleTotali.textContent = G.stelleTotali();
  }

  // Doppio click/tocco sul totale delle stelline: azzera tutti i contatori
  // (totale e quelli dei singoli giochi). Si riconosce a mano (due tocchi entro
  // 450 ms) cosi' funziona uguale con mouse e dito.
  let ultimoTocco = 0;
  function toccoTotaleStelle() {
    const ora = performance.now();
    if (ora - ultimoTocco > 450) {
      ultimoTocco = ora;
      return;
    }
    ultimoTocco = 0;
    window.Giocatore.azzeraStelle();
    renderHome();
    el.homeStelle.classList.remove("home-stelle--azzerato");
    void el.homeStelle.offsetWidth;
    el.homeStelle.classList.add("home-stelle--azzerato");
  }

  function rigeneraAvatar() {
    window.Giocatore.rigeneraAvatar();
    renderGiocatore();
    el.homeAvatar.classList.remove("home-utente__avatar--nuovo");
    void el.homeAvatar.offsetWidth;
    el.homeAvatar.classList.add("home-utente__avatar--nuovo");
  }

  function avviaGiocoDaHome(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    if (!gioco || !gioco.attivo) return;
    if (window.Ascolto) window.Ascolto.nuovoAvvio(); // l'ascolto parte acceso a ogni avvio dalla home
    if (gioco.tipo === "abbinamento") avviaAbbinamento(gameId);
    else if (gioco.tipo === "fette") avviaFette(gameId);
    else if (gioco.tipo === "lettere") avviaLettereSpeculari(gameId);
    else if (gioco.tipo === "riporto") avviaRiporto(gameId);
    else avviaLettura(gameId);
  }

  // ---------- Cronometro (condiviso tra i due giochi) ----------

  function tempoTrascorsoMs() {
    if (!stato) return 0;
    const inCorsoMs = stato.inCorso ? performance.now() - stato.inizioSegmento : 0;
    return stato.accumulatoMs + inCorsoMs;
  }

  // Tipi di partita che possono avere l'ascolto a voce (js/ascolto.js).
  function usaAscolto(tipo) {
    return tipo === "lettura" || tipo === "fette" || tipo === "lettere";
  }

  // Chiave per confrontare le parole: niente maiuscole ne' accenti, cosi' due
  // parole "uguali" non finiscono mai insieme tra quelle da scegliere.
  function chiaveParola(testo) {
    return String(testo).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function aggiornaDisplayCronometro() {
    if (!stato || !stato.cronometroEl) return;
    stato.cronometroEl.textContent = formattaTempo(tempoTrascorsoMs());
  }

  function avviaCronometro() {
    if (!stato || stato.inCorso) return;
    stato.inCorso = true;
    stato.inizioSegmento = performance.now();
    aggiornaDisplayCronometro();
    timerIntervalId = setInterval(aggiornaDisplayCronometro, 100);
    if (stato.tipo === "lettura") el.btnPausa.textContent = "⏸️ Pausa";
    if (usaAscolto(stato.tipo) && window.Ascolto) window.Ascolto.riprendi();
  }

  function pausaCronometro() {
    if (!stato || !stato.inCorso) return;
    stato.accumulatoMs += performance.now() - stato.inizioSegmento;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    clearInterval(timerIntervalId);
    aggiornaDisplayCronometro();
    if (stato.tipo === "lettura") el.btnPausa.textContent = "▶️ Riprendi";
    if (usaAscolto(stato.tipo) && window.Ascolto) window.Ascolto.pausa();
  }

  function togglePausa() {
    if (!stato || stato.tipo !== "lettura") return;
    if (stato.inCorso) pausaCronometro();
    else avviaCronometro();
  }

  // ---------- GIOCO 1: Leggi bisillabe piane semplici ----------

  // ---------- Frasi: scelta casuale senza ripetizioni ravvicinate ----------

  function chiaveFrase(frase) {
    return frase.map((b) => b.parola).join(" ");
  }

  function leggiFrasiRecenti() {
    try {
      const dati = JSON.parse(localStorage.getItem(STORAGE_FRASI_RECENTI)) || {};
      return dati;
    } catch (e) {
      return {};
    }
  }

  function salvaFrasiRecenti(dati) {
    try {
      localStorage.setItem(STORAGE_FRASI_RECENTI, JSON.stringify(dati));
    } catch (e) {
      /* storage non disponibile: si continua senza memoria */
    }
  }

  // Sorteggio puro tra tutte le frasi, escluse le ultime 20 giocate.
  function scegliFraseSenzaRipetizioni(gameId, pool) {
    const dati = leggiFrasiRecenti();
    const limite = Math.min(FRASI_RECENTI_DA_EVITARE, pool.length - 1);
    const recenti = (dati[gameId] || []).slice(-limite);
    const candidate = pool.filter((f) => !recenti.includes(chiaveFrase(f)));
    const sorgente = candidate.length ? candidate : pool;
    const frase = sorgente[Math.floor(Math.random() * sorgente.length)];
    dati[gameId] = recenti.concat(chiaveFrase(frase)).slice(-FRASI_RECENTI_DA_EVITARE);
    salvaFrasiRecenti(dati);
    return frase;
  }

  // Sceglie le parole/blocchetti da mostrare per un gioco di tipo "lettura"
  // o "frase": per "frase" viene scelta un'unica frase intera (ordine fisso,
  // lunghezza propria della frase), per "lettura" un set di N parole casuali.
  function selezionaParoleGioco(gioco) {
    const pool = GAME_DATA[gioco.id];
    if (!pool) return null;
    if (gioco.tipo === "frase") {
      return scegliFraseSenzaRipetizioni(gioco.id, pool).slice();
    }
    return mescola(pool).slice(0, PAROLE_PER_PARTITA_LETTURA);
  }

  function avviaLettura(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    if (!gioco || !gioco.attivo) return;
    const parole = selezionaParoleGioco(gioco);
    if (!parole) return;

    stato = {
      gameId,
      tipo: "lettura",
      parole,
      accumulatoMs: 0,
      inCorso: false,
      inizioSegmento: null,
      cronometroEl: el.cronometro,
    };

    el.nomeGioco.textContent = `${gioco.emoji} ${gioco.titolo}`;
    el.cronometro.textContent = formattaTempo(0);
    renderParoleGriglia(parole);
    apriAscolto();
    mostraSchermo("gioco");
    avviaCountdownESfocatura(() => avviaCronometro());
  }

  // Ascolto a voce opzionale (js/ascolto.js): non cambia le regole del gioco,
  // evidenzia le parole lette e, a parole finite, equivale a premere FINE.
  function apriAscolto() {
    if (!window.Ascolto || !stato) return;
    const gioco = GAMES.find((g) => g.id === stato.gameId);
    const partita = stato;
    window.Ascolto.apri({
      abilitato: !!(gioco && gioco.ascolto),
      griglia: el.paroleGriglia,
      parole: partita.parole,
      inCorso: () => stato === partita && partita.inCorso,
      inPausa: () => stato === partita && !partita.inCorso && partita.accumulatoMs > 0,
      tutteLette: () => fineDaAscolto(partita),
    });
  }

  // Tutte le parole evidenziate (a voce o con doppio tocco): il cronometro si
  // ferma subito; la schermata del tempo compare dopo un istante, cosi' si vede
  // l'ultima parola accendersi.
  function fineDaAscolto(partita) {
    if (stato !== partita || partita.tipo !== "lettura") return;
    if (partita.inCorso) pausaCronometro();
    if (window.Ascolto) window.Ascolto.chiudi();
    impostaBottoniLettura(false); // niente Pausa/Ricomincia nel breve intervallo
    setTimeout(() => {
      if (stato === partita && schermi.gioco.classList.contains("attivo")) mostraModaleFine();
    }, 700);
  }

  function renderParoleGriglia(parole) {
    el.paroleGriglia.innerHTML = "";
    parole.forEach((p) => {
      const tile = document.createElement("div");
      tile.className = "parola-tile";
      if (p.tipo === "verbo") tile.classList.add("parola-tile--verbo");

      // Le congiunzioni non hanno il suggerimento sillabico.
      const sillabeHtml = p.sillabe
        ? `<span class="parola-tile__sillabe">${escapeHtml(p.sillabe)}</span>`
        : "";

      tile.innerHTML = `
        <span class="parola-tile__parola">${escapeHtml(p.parola)}</span>
        ${sillabeHtml}
      `;
      el.paroleGriglia.appendChild(tile);
    });
  }

  function impostaBottoniLettura(abilitati) {
    el.btnPausa.disabled = !abilitati;
    el.btnRicomincia.disabled = !abilitati;
    el.btnNuovaSfida.disabled = !abilitati;
    el.btnFine.disabled = !abilitati;
    // btn-esci resta sempre cliccabile
  }

  // Conto alla rovescia + sfocatura generico: usato dal gioco di lettura
  // e da "Parola a fette", ciascuno con il proprio contenuto/overlay.
  function eseguiCountdown(contenutoEl, overlayEl, testoEl, impostaBottoni, dopo) {
    contenutoEl.classList.add("sfocato");
    overlayEl.classList.add("attivo");
    impostaBottoni(false);

    let i = 0;
    function passo() {
      if (i >= COUNTDOWN_STEPS.length) {
        overlayEl.classList.remove("attivo");
        contenutoEl.classList.remove("sfocato");
        impostaBottoni(true);
        dopo();
        return;
      }
      testoEl.textContent = COUNTDOWN_STEPS[i];
      testoEl.style.animation = "none";
      void testoEl.offsetWidth;
      testoEl.style.animation = "";
      i++;
      setTimeout(passo, COUNTDOWN_STEP_MS);
    }
    passo();
  }

  function avviaCountdownESfocatura(dopo) {
    eseguiCountdown(el.paroleGriglia, el.countdownOverlay, el.countdownTesto, impostaBottoniLettura, dopo);
  }

  function ricominciaLettura() {
    if (!stato || stato.tipo !== "lettura") return;
    clearInterval(timerIntervalId);
    stato.accumulatoMs = 0;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    el.cronometro.textContent = formattaTempo(0);
    el.btnPausa.textContent = "⏸️ Pausa";
    renderParoleGriglia(stato.parole);
    apriAscolto();
    mostraSchermo("gioco");
    avviaCountdownESfocatura(() => avviaCronometro());
  }

  function nuovaSfidaLettura() {
    if (!stato) return;
    avviaLettura(stato.gameId);
  }

  function finisciLettura() {
    if (!stato || stato.tipo !== "lettura") return;
    if (stato.inCorso) pausaCronometro();
    if (window.Ascolto) window.Ascolto.chiudi();
    mostraModaleFine();
  }

  // ---------- GIOCO 2: Combina bisillabe ----------

  function avviaAbbinamento(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    const pool = GAME_DATA[gameId];
    if (!gioco || !gioco.attivo || !pool) return;

    const parole = mescola(pool).slice(0, PAROLE_PER_PARTITA_ABBINAMENTO);
    const coppie = parole.map((p, i) => {
      const parti = p.sillabe.split("-");
      return {
        id: "c" + i,
        parola: p.parola,
        prima: parti[0],
        seconda: parti.slice(1).join("-"),
      };
    });

    stato = {
      gameId,
      tipo: "abbinamento",
      coppie,
      coppieTrovate: 0,
      selezione: null,
      bloccato: false,
      accumulatoMs: 0,
      inCorso: false,
      inizioSegmento: null,
      cronometroEl: el.abbinaCronometro,
    };

    el.abbinaCronometro.textContent = formattaTempo(0);
    el.abbinaMessaggio.textContent = "";
    renderColonneAbbina(coppie);
    mostraSchermo("abbina");
    avviaCronometro();
  }

  function renderColonneAbbina(coppie) {
    const ordineSinistra = mescola(coppie);
    const ordineDestra = mescola(coppie);

    el.abbinaSinistra.innerHTML = "";
    el.abbinaDestra.innerHTML = "";

    ordineSinistra.forEach((c) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = c.prima;
      tile.addEventListener("click", () => gestisciClickAbbina(c.id, "sx", tile));
      el.abbinaSinistra.appendChild(tile);
    });

    ordineDestra.forEach((c) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = c.seconda;
      tile.addEventListener("click", () => gestisciClickAbbina(c.id, "dx", tile));
      el.abbinaDestra.appendChild(tile);
    });
  }

  function gestisciClickAbbina(id, lato, elemento) {
    if (!stato || stato.tipo !== "abbinamento" || stato.bloccato) return;
    if (elemento.classList.contains("corretta")) return;

    if (!stato.selezione) {
      stato.selezione = { lato, id, elemento };
      elemento.classList.add("selezionata");
      return;
    }

    if (stato.selezione.lato === lato) {
      stato.selezione.elemento.classList.remove("selezionata");
      if (stato.selezione.elemento === elemento) {
        stato.selezione = null;
        return;
      }
      stato.selezione = { lato, id, elemento };
      elemento.classList.add("selezionata");
      return;
    }

    const primaScelta = stato.selezione;
    stato.selezione = null;

    if (primaScelta.id === id) {
      primaScelta.elemento.classList.remove("selezionata");
      primaScelta.elemento.classList.add("corretta");
      primaScelta.elemento.disabled = true;
      elemento.classList.add("corretta");
      elemento.disabled = true;
      el.abbinaMessaggio.textContent = "";
      stato.coppieTrovate++;

      if (stato.coppieTrovate >= stato.coppie.length) {
        pausaCronometro();
        mostraModaleFineTra(500);
      }
    } else {
      stato.bloccato = true;
      primaScelta.elemento.classList.remove("selezionata");
      primaScelta.elemento.classList.add("errore");
      elemento.classList.add("errore");
      el.abbinaMessaggio.textContent = "❌ Non è una coppia, riprova!";
      setTimeout(() => {
        primaScelta.elemento.classList.remove("errore");
        elemento.classList.remove("errore");
        stato.bloccato = false;
      }, 500);
    }
  }

  function ricominciaAbbinamento() {
    if (!stato || stato.tipo !== "abbinamento") return;
    clearInterval(timerIntervalId);
    stato.accumulatoMs = 0;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    stato.coppieTrovate = 0;
    stato.selezione = null;
    stato.bloccato = false;
    el.abbinaCronometro.textContent = formattaTempo(0);
    el.abbinaMessaggio.textContent = "";
    renderColonneAbbina(stato.coppie);
    mostraSchermo("abbina");
    avviaCronometro();
  }

  function nuovaSfidaAbbinamento() {
    if (!stato) return;
    avviaAbbinamento(stato.gameId);
  }

  // ---------- GIOCO 5: Parola a fette ----------

  function impostaBottoniFette(abilitati) {
    el.fetteBtnRicomincia.disabled = !abilitati;
    el.fetteBtnNuovaSfida.disabled = !abilitati;
    // fette-btn-esci resta sempre cliccabile
  }

  function avviaCountdownFette(dopo) {
    eseguiCountdown(
      el.fetteContenuto,
      el.fetteCountdownOverlay,
      el.fetteCountdownTesto,
      impostaBottoniFette,
      dopo
    );
  }

  // Pesca 5 parole a caso per ciascuna delle 3 posizioni di sillaba dal
  // pool della parola target (che ne ha 7 per posizione): 15 parole in
  // tutto, cosi' anche le due posizioni non scelte restano equilibrate a
  // 5 come quella scelta.
  // Le 15 parole sono sempre tutte diverse tra loro (e diverse dalla parola
  // target): se nel file dati ce ne fosse una ripetuta, viene scartata.
  function selezionaParoleFette(fetta) {
    const risultato = [];
    const viste = new Set([chiaveParola(fetta.parola)]);
    [1, 2, 3].forEach((posizione) => {
      const diQuestaPosizione = fetta.parole.filter((p) => p.posizione === posizione);
      let prese = 0;
      mescola(diQuestaPosizione).forEach((p) => {
        const k = chiaveParola(p.parola);
        if (prese >= PAROLE_PER_PARTITA_FETTE || viste.has(k)) return;
        viste.add(k);
        risultato.push(p);
        prese++;
      });
    });
    return risultato;
  }

  function avviaFette(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    const pool = GAME_DATA[gameId];
    if (!gioco || !gioco.attivo || !pool || !pool.length) return;

    const fetta = pool[Math.floor(Math.random() * pool.length)];
    const paroleSelezionate = selezionaParoleFette(fetta);

    stato = {
      gameId,
      tipo: "fette",
      fetta,
      paroleSelezionate,
      sillabaScelta: null,
      sillabaBloccata: false,
      ordineGriglia: [],
      trovate: 0,
      accumulatoMs: 0,
      inCorso: false,
      inizioSegmento: null,
      cronometroEl: el.fetteCronometro,
    };

    el.fetteCronometro.textContent = formattaTempo(0);
    el.fetteMessaggio.textContent = "";
    renderFette(fetta, paroleSelezionate);
    apriAscoltoFette();
    mostraSchermo("fette");
    avviaCountdownFette(() => avviaCronometro());
  }

  function renderFette(fetta, paroleSelezionate) {
    const parti = fetta.sillabe.split("-");

    el.fetteParolaTile.innerHTML = `
      <span class="parola-tile__parola">${escapeHtml(fetta.parola)}</span>
      <span class="parola-tile__sillabe">${escapeHtml(fetta.sillabe)}</span>
    `;

    el.fetteSillabeScelta.innerHTML = "";
    parti.forEach((sillaba, i) => {
      const posizione = i + 1;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = sillaba;
      tile.addEventListener("click", () => scegliSillabaFette(posizione, tile));
      el.fetteSillabeScelta.appendChild(tile);
    });

    const paroleMescolate = mescola(paroleSelezionate);
    stato.ordineGriglia = paroleMescolate; // stesso ordine delle caselle (serve all'ascolto)
    el.fetteParoleGriglia.innerHTML = "";
    paroleMescolate.forEach((p) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = p.parola;
      tile.addEventListener("click", () => gestisciClickParolaFette(p.posizione, tile));
      el.fetteParoleGriglia.appendChild(tile);
    });

    preselezionaSillabaFette();
  }

  // All'inizio una delle 3 sillabe e' gia' scelta a caso. Il bambino puo'
  // ancora toccarne un'altra, ma solo finche' non sceglie la prima parola:
  // da quel momento la sillaba resta fissa per tutta la partita.
  function preselezionaSillabaFette() {
    if (!stato || stato.tipo !== "fette") return;
    const bottoni = $$(".abbina-tile", el.fetteSillabeScelta);
    if (!bottoni.length) return;
    const i = Math.floor(Math.random() * bottoni.length);
    stato.sillabaBloccata = false;
    scegliSillabaFette(i + 1, bottoni[i]);
  }

  function scegliSillabaFette(posizione, elemento) {
    if (!stato || stato.tipo !== "fette" || stato.sillabaBloccata) return;
    stato.sillabaScelta = posizione;
    $$(".abbina-tile", el.fetteSillabeScelta).forEach((t) => t.classList.remove("selezionata"));
    elemento.classList.add("selezionata");
    el.fetteMessaggio.textContent = "";
  }

  function bloccaSillabaFette() {
    stato.sillabaBloccata = true;
    $$(".abbina-tile", el.fetteSillabeScelta).forEach((t) => {
      t.disabled = true;
    });
  }

  // Ascolto a voce (js/ascolto.js): ogni parola della griglia detta ad alta
  // voce vale come toccarla a mano (giusta o sbagliata, stesse regole).
  function apriAscoltoFette() {
    if (!window.Ascolto || !stato) return;
    const gioco = GAMES.find((g) => g.id === stato.gameId);
    const partita = stato;
    window.Ascolto.apri({
      modo: "selezione",
      schermo: "fette",
      abilitato: !!(gioco && gioco.ascolto),
      parole: partita.ordineGriglia,
      inCorso: () => stato === partita && partita.inCorso,
      inPausa: () => stato === partita && !partita.inCorso && partita.accumulatoMs > 0,
      alTrovata: (i) => {
        if (stato !== partita) return;
        const tile = el.fetteParoleGriglia.children[i];
        // la voce non "declicca" e non tocca le parole gia' decise
        if (!tile || tile.classList.contains("corretta") || tile.classList.contains("errore")) return;
        gestisciClickParolaFette(partita.ordineGriglia[i].posizione, tile);
      },
    });
  }

  function gestisciClickParolaFette(posizioneParola, elemento) {
    if (!stato || stato.tipo !== "fette") return;
    if (elemento.classList.contains("corretta")) return;

    if (!stato.sillabaScelta) {
      el.fetteMessaggio.textContent = "Scegli prima una sillaba qui sopra!";
      return;
    }
    if (!stato.sillabaBloccata) bloccaSillabaFette();

    // Un blocchetto gia' segnato come errore si "declicca" tornando neutro,
    // cosi' il bambino puo' correggersi e riprovare.
    if (elemento.classList.contains("errore")) {
      elemento.classList.remove("errore");
      return;
    }

    if (posizioneParola === stato.sillabaScelta) {
      elemento.classList.add("corretta");
      elemento.disabled = true;
      el.fetteMessaggio.textContent = "";
      stato.trovate++;

      if (stato.trovate >= PAROLE_PER_PARTITA_FETTE) {
        pausaCronometro();
        if (window.Ascolto) window.Ascolto.chiudi();
        mostraModaleFineTra(500);
      }
    } else {
      elemento.classList.add("errore");
      el.fetteMessaggio.textContent = "❌ Non ha quella sillaba, riprova!";
    }
  }

  function ricominciaFette() {
    if (!stato || stato.tipo !== "fette") return;
    clearInterval(timerIntervalId);
    stato.accumulatoMs = 0;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    stato.sillabaScelta = null;
    stato.sillabaBloccata = false;
    stato.trovate = 0;
    el.fetteCronometro.textContent = formattaTempo(0);
    el.fetteMessaggio.textContent = "";
    renderFette(stato.fetta, stato.paroleSelezionate);
    apriAscoltoFette();
    mostraSchermo("fette");
    avviaCountdownFette(() => avviaCronometro());
  }

  function nuovaSfidaFette() {
    if (!stato) return;
    avviaFette(stato.gameId);
  }

  // ---------- GIOCO 6: Lettere speculari ----------

  function impostaBottoniLettere(abilitati) {
    el.lettereBtnRicomincia.disabled = !abilitati;
    el.lettereBtnNuovaSfida.disabled = !abilitati;
    // lettere-btn-esci resta sempre cliccabile
  }

  function avviaCountdownLettere(dopo) {
    eseguiCountdown(
      el.lettereContenuto,
      el.lettereCountdownOverlay,
      el.lettereCountdownTesto,
      impostaBottoniLettere,
      dopo
    );
  }

  // Pesca 6 parole a caso per ciascuna delle 4 lettere (b/d/p/q) dal pool
  // del gioco: 24 parole in tutto, ciascuna con la sua lettera di
  // appartenenza.
  // Le 20 parole sono sempre tutte diverse tra loro: se nel file dati una
  // parola comparisse due volte (anche sotto lettere diverse), viene scartata.
  function pescaParoleLettere(pool) {
    const parole = [];
    const viste = new Set();
    LETTERE_SPECULARI.forEach((lettera) => {
      let prese = 0;
      mescola(pool[lettera]).forEach((p) => {
        const k = chiaveParola(p.parola);
        if (prese >= PAROLE_PER_LETTERA || viste.has(k)) return;
        viste.add(k);
        parole.push({ parola: p.parola, lettera });
        prese++;
      });
    });
    return parole;
  }

  function avviaLettereSpeculari(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    const pool = GAME_DATA[gameId];
    if (!gioco || !gioco.attivo || !pool) return;

    const parole = pescaParoleLettere(pool);

    stato = {
      gameId,
      tipo: "lettere",
      parole,
      letteraScelta: null,
      letteraBloccata: false,
      ordineGriglia: [],
      trovate: 0,
      accumulatoMs: 0,
      inCorso: false,
      inizioSegmento: null,
      cronometroEl: el.lettereCronometro,
    };

    el.lettereCronometro.textContent = formattaTempo(0);
    el.lettereMessaggio.textContent = "";
    renderLettereSpeculari(parole);
    apriAscoltoLettere();
    mostraSchermo("lettere");
    avviaCountdownLettere(() => avviaCronometro());
  }

  function renderLettereSpeculari(parole) {
    el.lettereScelta.innerHTML = "";
    LETTERE_SPECULARI.forEach((lettera) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = lettera;
      tile.addEventListener("click", () => scegliLetteraSpeculare(lettera, tile));
      el.lettereScelta.appendChild(tile);
    });

    const paroleMescolate = mescola(parole);
    stato.ordineGriglia = paroleMescolate; // stesso ordine delle caselle (serve all'ascolto)
    el.lettereGriglia.innerHTML = "";
    paroleMescolate.forEach((p) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = p.parola;
      tile.addEventListener("click", () => gestisciClickParolaLettere(p.lettera, tile));
      el.lettereGriglia.appendChild(tile);
    });

    preselezionaLetteraSpeculare();
  }

  // All'inizio una delle 4 lettere (b/d/p/q) e' gia' scelta a caso, come la
  // sillaba in "Parola a fette": il bambino puo' toccarne un'altra, ma solo
  // finche' non sceglie la prima parola; poi resta fissa per la partita.
  function preselezionaLetteraSpeculare() {
    if (!stato || stato.tipo !== "lettere") return;
    const bottoni = $$(".abbina-tile", el.lettereScelta);
    if (!bottoni.length) return;
    const i = Math.floor(Math.random() * bottoni.length);
    stato.letteraBloccata = false;
    scegliLetteraSpeculare(LETTERE_SPECULARI[i], bottoni[i]);
  }

  function scegliLetteraSpeculare(lettera, elemento) {
    if (!stato || stato.tipo !== "lettere" || stato.letteraBloccata) return;
    stato.letteraScelta = lettera;
    $$(".abbina-tile", el.lettereScelta).forEach((t) => t.classList.remove("selezionata"));
    elemento.classList.add("selezionata");
    el.lettereMessaggio.textContent = "";
  }

  function bloccaLetteraSpeculare() {
    stato.letteraBloccata = true;
    $$(".abbina-tile", el.lettereScelta).forEach((t) => {
      t.disabled = true;
    });
  }

  // Ascolto a voce (js/ascolto.js): ogni parola della griglia detta ad alta
  // voce vale come toccarla (giusta o sbagliata, stesse regole).
  function apriAscoltoLettere() {
    if (!window.Ascolto || !stato) return;
    const gioco = GAMES.find((g) => g.id === stato.gameId);
    const partita = stato;
    window.Ascolto.apri({
      modo: "selezione",
      schermo: "lettere",
      abilitato: !!(gioco && gioco.ascolto),
      parole: partita.ordineGriglia,
      inCorso: () => stato === partita && partita.inCorso,
      inPausa: () => stato === partita && !partita.inCorso && partita.accumulatoMs > 0,
      alTrovata: (i) => {
        if (stato !== partita) return;
        const tile = el.lettereGriglia.children[i];
        // la voce non "declicca" e non tocca le parole gia' decise
        if (!tile || tile.classList.contains("corretta") || tile.classList.contains("errore")) return;
        gestisciClickParolaLettere(partita.ordineGriglia[i].lettera, tile);
      },
    });
  }

  function gestisciClickParolaLettere(letteraParola, elemento) {
    if (!stato || stato.tipo !== "lettere") return;
    if (elemento.classList.contains("corretta")) return;

    if (!stato.letteraScelta) {
      el.lettereMessaggio.textContent = "Scegli prima una lettera qui sopra!";
      return;
    }
    if (!stato.letteraBloccata) bloccaLetteraSpeculare();

    // Un blocchetto gia' segnato come errore si "declicca" tornando neutro,
    // cosi' il bambino puo' correggersi e riprovare.
    if (elemento.classList.contains("errore")) {
      elemento.classList.remove("errore");
      return;
    }

    if (letteraParola === stato.letteraScelta) {
      elemento.classList.add("corretta");
      elemento.disabled = true;
      el.lettereMessaggio.textContent = "";
      stato.trovate++;

      if (stato.trovate >= PAROLE_PER_LETTERA) {
        pausaCronometro();
        if (window.Ascolto) window.Ascolto.chiudi();
        mostraModaleFineTra(500);
      }
    } else {
      elemento.classList.add("errore");
      el.lettereMessaggio.textContent = "❌ Non ha quella lettera, riprova!";
    }
  }

  function ricominciaLettereSpeculari() {
    if (!stato || stato.tipo !== "lettere") return;
    clearInterval(timerIntervalId);
    stato.accumulatoMs = 0;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    stato.letteraScelta = null;
    stato.letteraBloccata = false;
    stato.trovate = 0;
    el.lettereCronometro.textContent = formattaTempo(0);
    el.lettereMessaggio.textContent = "";
    renderLettereSpeculari(stato.parole);
    apriAscoltoLettere();
    mostraSchermo("lettere");
    avviaCountdownLettere(() => avviaCronometro());
  }

  function nuovaSfidaLettereSpeculari() {
    if (!stato) return;
    avviaLettereSpeculari(stato.gameId);
  }

  // ---------- GIOCO 7: Somme col riporto ----------

  const CELLE_SCATOLA = 10;
  const CELLE_RIPORTO = 8;
  const SOGLIA_DRAG_PX = 8;
  const FRASE_DA_DIRE = "Pronuncia l'operazione per intero con il suo risultato";
  // Con la voce: "dire" la somma intera; senza microfono (browser che non lo
  // supporta o permesso negato) si ripiega sulla scelta tra 6 risposte.
  function testoPerfetto() {
    return stato && stato.modoRisposta === "scelta"
      ? "Perfetto! Ora scegli il risultato giusto."
      : "Perfetto! Ora dì tutta l'operazione.";
  }

  // Opzione (resta valida tra una sfida e l'altra finche' l'app e' aperta)
  let riportoMostraNumeri = true;
  let riportoUltimaSomma = null;
  let riportoDrag = null;
  let riportoUltimoDragMs = 0;
  // Ultimo tocco su una linea di taglio (per riconoscere il doppio tocco/click che spezza).
  let riportoUltimoTaglio = null;
  const DOPPIO_TAGLIO_MS = 450;

  function impostaBottoniRiporto(abilitati) {
    el.riportoBtnRicomincia.disabled = !abilitati;
    el.riportoBtnNuovaSfida.disabled = !abilitati;
    el.riportoBtnControlla.disabled = !abilitati;
    // riporto-btn-esci resta sempre cliccabile
  }

  function avviaCountdownRiporto(dopo) {
    eseguiCountdown(
      el.riportoContenuto,
      el.riportoCountdownOverlay,
      el.riportoCountdownTesto,
      impostaBottoniRiporto,
      dopo
    );
  }

  // Due numeri da 1 a 9 con somma da 11 a 18 (cioe' sempre con riporto).
  function generaSommaRiporto() {
    const coppie = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        if (a + b >= 11) coppie.push([a, b]);
      }
    }
    let scelta;
    do {
      scelta = coppie[Math.floor(Math.random() * coppie.length)];
    } while (scelta.join("+") === riportoUltimaSomma && coppie.length > 1);
    riportoUltimaSomma = scelta.join("+");
    return scelta;
  }

  // Risultato giusto + 5 sbagliati "vicini" (tra 10 e 19), in ordine casuale.
  function generaRisposteRiporto(totale) {
    const candidati = [];
    for (let n = 10; n <= 19; n++) {
      if (n !== totale) candidati.push({ n, r: Math.random() });
    }
    candidati.sort((x, y) => Math.abs(x.n - totale) - Math.abs(y.n - totale) || x.r - y.r);
    return mescola([totale].concat(candidati.slice(0, 5).map((c) => c.n)));
  }

  function creaZoneRiporto(a, b) {
    return {
      fuori: [
        { id: 1, colore: "a", len: a },
        { id: 2, colore: "b", len: b },
      ],
      scatola: [],
      riporto: [],
    };
  }

  function sommaQuadretti(pezzi) {
    return pezzi.reduce((tot, p) => tot + p.len, 0);
  }

  function avviaRiporto(gameId) {
    riportoUltimoTaglio = null;
    if (window.AscoltoFrase) window.AscoltoFrase.ferma();
    const gioco = GAMES.find((g) => g.id === gameId);
    if (!gioco || !gioco.attivo) return;

    const [a, b] = generaSommaRiporto();
    stato = {
      gameId,
      tipo: "riporto",
      a,
      b,
      totale: a + b,
      risposte: generaRisposteRiporto(a + b),
      zone: creaZoneRiporto(a, b),
      prossimoId: 3,
      selezionato: null,
      fase: "gioco", // "gioco" -> "risposte" -> "finito"
      modoRisposta: null, // "voce" (frase intera a voce) o "scelta" (ripiego senza microfono)
      sentito: { parole: [], hint: "" },
      statoAscolto: { testo: "", tipo: "" },
      sbagliate: [],
      messaggio: "",
      accumulatoMs: 0,
      inCorso: false,
      inizioSegmento: null,
      cronometroEl: el.riportoCronometro,
    };

    el.riportoCronometro.textContent = formattaTempo(0);
    renderRiporto();
    mostraSchermo("riporto");
    avviaCountdownRiporto(() => avviaCronometro());
  }

  function ricominciaRiporto() {
    if (!stato || stato.tipo !== "riporto") return;
    clearInterval(timerIntervalId);
    annullaDragRiporto();
    if (window.AscoltoFrase) window.AscoltoFrase.ferma();
    stato.zone = creaZoneRiporto(stato.a, stato.b);
    stato.prossimoId = 3;
    stato.selezionato = null;
    stato.fase = "gioco";
    stato.modoRisposta = null;
    stato.sbagliate = [];
    stato.messaggio = "";
    stato.accumulatoMs = 0;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    el.riportoCronometro.textContent = formattaTempo(0);
    renderRiporto();
    mostraSchermo("riporto");
    avviaCountdownRiporto(() => avviaCronometro());
  }

  function nuovaSfidaRiporto() {
    if (!stato) return;
    annullaDragRiporto();
    avviaRiporto(stato.gameId);
  }

  function creaPezzoEl(p) {
    const d = document.createElement("div");
    d.className = "pezzo pezzo--" + p.colore;
    if (stato.selezionato === p.id) d.classList.add("selezionato");
    if (stato.fase === "finito") d.classList.add("pezzo--bloccato");
    d.dataset.id = String(p.id);
    d.style.width = `calc(${p.len} * var(--cella))`;
    if (stato.fase !== "finito") {
      for (let k = 1; k < p.len; k++) {
        const t = document.createElement("span");
        t.className = "taglio";
        t.dataset.id = String(p.id);
        t.dataset.k = String(k);
        t.style.left = `calc(${k} * var(--cella))`;
        d.appendChild(t);
      }
    }
    return d;
  }

  function renderZonaRiporto(contenitore, pezzi) {
    contenitore.innerHTML = "";
    pezzi.forEach((p) => contenitore.appendChild(creaPezzoEl(p)));
  }

  function renderRiporto() {
    const s = stato;
    const nScatola = sommaQuadretti(s.zone.scatola);
    const nRiporto = sommaQuadretti(s.zone.riporto);

    el.riportoSomma.innerHTML =
      `<span class="rip-n rip-n--a">${s.a}</span><span class="rip-op">+</span>` +
      `<span class="rip-n rip-n--b">${s.b}</span><span class="rip-op">=</span>` +
      `<span class="rip-ris">${s.fase === "finito" ? s.totale : "?"}</span>`;
    // A risposta giusta la striscia delle risposte sparisce e il "Bravo!"
    // resta sotto la somma.
    el.riportoMessaggio.textContent =
      s.fase === "finito"
        ? `Bravo! ${s.a} + ${s.b} = ${s.totale} · ${formattaTempo(tempoTrascorsoMs())}`
        : s.messaggio;
    el.riportoMessaggio.classList.toggle("riporto-messaggio--bravo", s.fase === "finito");

    renderZonaRiporto(el.riportoPezziFuori, s.zone.fuori);
    renderZonaRiporto(el.riportoPezziScatola, s.zone.scatola);
    renderZonaRiporto(el.riportoPezziRiporto, s.zone.riporto);

    el.riportoContatoreScatola.textContent = `${nScatola} / ${CELLE_SCATOLA}`;
    el.riportoContatoreScatola.className =
      "riporto-contatore" +
      (nScatola === CELLE_SCATOLA ? " ok" : nScatola > CELLE_SCATOLA ? " troppo" : "");
    el.riportoContatoreRiporto.textContent = String(nRiporto);
    el.riportoContatoreRiporto.className =
      "riporto-contatore" + (nRiporto > CELLE_RIPORTO ? " troppo" : "");
    el.riportoEsce.hidden = nScatola <= CELLE_SCATOLA;

    el.riportoContenuto.classList.toggle("senza-numeri", !riportoMostraNumeri);

    const mostraRisposte = s.fase === "risposte";
    el.riportoRisposteCard.hidden = !mostraRisposte;
    el.riportoRisposteCard.classList.toggle("riporto-risposte--voce", mostraRisposte && s.modoRisposta === "voce");
    if (mostraRisposte) {
      const aVoce = s.modoRisposta === "voce";
      el.riportoDomanda.textContent = aVoce ? `🎤 ${FRASE_DA_DIRE}` : `Quanto fa ${s.a} + ${s.b}?`;
      el.riportoSentito.hidden = !aVoce;
      el.riportoRisposte.hidden = aVoce;
      el.riportoRisposte.innerHTML = "";
      if (aVoce) {
        disegnaSentitoRiporto();
      } else {
        el.riportoAscoltoStato.hidden = !s.statoAscolto.testo;
        el.riportoAscoltoStato.textContent = s.statoAscolto.testo;
        el.riportoAscoltoStato.className = "riporto-ascolto-stato riporto-ascolto-stato--errore";
        s.risposte.forEach((n) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "riporto-risposta";
          b.textContent = String(n);
          if (s.sbagliate.includes(n)) {
            b.classList.add("sbagliata");
            b.disabled = true;
          }
          b.addEventListener("click", () => rispondiRiporto(n));
          el.riportoRisposte.appendChild(b);
        });
      }
    }

    el.riportoBtnControlla.textContent = "✅ CONTROLLA";
  }

  // Dopo ogni spostamento/taglio: se la scatola ha esattamente 10 quadretti
  // e non resta nulla fuori (quindi il riporto e' giusto) compaiono le
  // risposte; il gioco NON finisce qui.
  function aggiornaRiporto() {
    const s = stato;
    if (s.fase !== "finito") {
      const valido =
        sommaQuadretti(s.zone.scatola) === CELLE_SCATOLA && sommaQuadretti(s.zone.fuori) === 0;
      if (valido) {
        if (s.fase !== "risposte") {
          s.fase = "risposte";
          s.sbagliate = [];
          iniziaRispostaRiporto();
          s.messaggio = testoPerfetto();
        }
      } else {
        if (s.fase === "risposte" && window.AscoltoFrase) window.AscoltoFrase.ferma();
        s.fase = "gioco";
        s.modoRisposta = null;
        s.sbagliate = [];
        s.messaggio = "";
      }
    }
    renderRiporto();
  }

  // ---- Risposta a voce: il bambino dice "sette più cinque uguale dodici" ----

  function iniziaRispostaRiporto() {
    const s = stato;
    const AF = window.AscoltoFrase;
    s.sentito = { parole: [], hint: "" };
    s.statoAscolto = { testo: "", tipo: "" };
    if (!AF || !AF.supportato) {
      s.modoRisposta = "scelta";
      s.statoAscolto = { testo: "Voce non supportata da questo browser: scegli la risposta.", tipo: "errore" };
      return;
    }
    s.modoRisposta = "voce";
    const partita = s;
    AF.avvia({
      bersaglio: AF.bersaglio(s.a, s.b),
      onStato: (testo, tipo) => {
        if (stato !== partita) return;
        partita.statoAscolto = { testo, tipo };
        disegnaSentitoRiporto();
      },
      onTesto: (t) => {
        if (stato !== partita) return;
        partita.sentito = { parole: t.parole, hint: "" };
        disegnaSentitoRiporto();
      },
      onTrovata: () => {
        if (stato !== partita || partita.fase !== "risposte") return;
        rispostaGiustaRiporto();
      },
      onErrore: (tipo) => {
        if (stato !== partita || partita.fase !== "risposte") return;
        // il microfono non si puo' usare: ripiego sulla scelta multipla
        partita.modoRisposta = "scelta";
        partita.statoAscolto = {
          testo:
            tipo === "negato"
              ? "Microfono non consentito: scegli la risposta."
              : "Il microfono non funziona: scegli la risposta.",
          tipo: "errore",
        };
        partita.messaggio = testoPerfetto();
        renderRiporto();
      },
    });
  }

  // Aggiorna solo la riga "Ho sentito: ..." (senza ridisegnare i pezzi).
  function disegnaSentitoRiporto() {
    const s = stato;
    if (!s || s.fase !== "risposte" || s.modoRisposta !== "voce") return;
    const box = el.riportoSentito;
    box.innerHTML = "";
    const stat = document.createElement("span");
    const tipo = s.statoAscolto.tipo === "attivo" ? "attivo" : s.statoAscolto.tipo ? "errore" : "attesa";
    stat.className = "sentito__stato sentito__stato--" + tipo;
    stat.textContent = s.statoAscolto.testo ? (tipo === "attivo" ? "🎤 " : "") + s.statoAscolto.testo : "🎤 …";
    box.appendChild(stat);
    const testo = document.createElement("span");
    testo.className = "sentito__testo";
    if (!s.sentito.parole.length) {
      testo.classList.add("sentito__testo--vuoto");
      testo.textContent = "Parla pure: qui vedrai quello che ascolto";
    } else {
      s.sentito.parole.forEach((p) => {
        const w = document.createElement("span");
        w.className = "sentito__parola" + (p.stato ? " sentito__parola--" + p.stato : "");
        w.textContent = p.testo;
        testo.appendChild(w);
        testo.appendChild(document.createTextNode(" "));
      });
    }
    box.appendChild(testo);
    el.riportoAscoltoStato.hidden = true;
  }

  function trovaPezzoRiporto(id) {
    for (const zona of ["fuori", "scatola", "riporto"]) {
      const i = stato.zone[zona].findIndex((p) => p.id === id);
      if (i >= 0) return { zona, i, pezzo: stato.zone[zona][i] };
    }
    return null;
  }

  function muoviPezzoRiporto(id, zonaDest) {
    if (!stato || stato.tipo !== "riporto" || stato.fase === "finito") return;
    const trovato = trovaPezzoRiporto(id);
    if (!trovato) return;
    stato.selezionato = null;
    if (trovato.zona !== zonaDest) {
      stato.zone[trovato.zona].splice(trovato.i, 1);
      stato.zone[zonaDest].push(trovato.pezzo); // uno dopo l'altro da sinistra
    }
    aggiornaRiporto();
  }

  function spezzaPezzoRiporto(id, k) {
    if (!stato || stato.tipo !== "riporto" || stato.fase === "finito") return;
    const trovato = trovaPezzoRiporto(id);
    if (!trovato || k < 1 || k >= trovato.pezzo.len) return;
    const { zona, i, pezzo } = trovato;
    const sinistro = { id: stato.prossimoId++, colore: pezzo.colore, len: k };
    const destro = { id: stato.prossimoId++, colore: pezzo.colore, len: pezzo.len - k };
    stato.zone[zona].splice(i, 1, sinistro, destro);
    stato.selezionato = null;
    aggiornaRiporto();
  }

  function controllaRiporto() {
    if (!stato || stato.tipo !== "riporto") return;
    if (stato.fase === "finito") return; // il modale e' gia' in arrivo (vedi rispondiRiporto)
    const nScatola = sommaQuadretti(stato.zone.scatola);
    const nFuori = sommaQuadretti(stato.zone.fuori);
    if (stato.fase === "risposte") {
      stato.messaggio = testoPerfetto();
    } else if (nScatola > CELLE_SCATOLA) {
      stato.messaggio = "Il bastoncino esce dalla scatola: spezzalo dove finisce il 10!";
    } else if (nScatola === CELLE_SCATOLA && nFuori > 0) {
      stato.messaggio = "Scatola piena! Ora sposta l'avanzo nella scatola del riporto.";
    } else if (nFuori === 0) {
      stato.messaggio = "La scatola deve contenere esattamente 10 quadretti.";
    } else {
      stato.messaggio = "Sposta i bastoncini nella scatola da 10 per riempirla.";
    }
    renderRiporto();
  }

  // Risposta giusta (frase detta per intero, o numero scelto nel ripiego):
  // il cronometro si ferma e si calcolano le stelline.
  function rispostaGiustaRiporto() {
    if (!stato || stato.tipo !== "riporto" || stato.fase !== "risposte") return;
    if (window.AscoltoFrase) window.AscoltoFrase.ferma();
    pausaCronometro();
    stato.fase = "finito";
    stato.selezionato = null;
    stato.messaggio = "";
    // un istante per vedere il "Bravo!" e il risultato, poi si apre il modale
    const partita = stato;
    setTimeout(() => {
      if (stato === partita && partita.fase === "finito") mostraModaleFine();
    }, 1100);
    renderRiporto();
  }

  // Ripiego senza microfono: scelta tra 6 risposte.
  function rispondiRiporto(n) {
    if (!stato || stato.tipo !== "riporto" || stato.fase !== "risposte" || stato.modoRisposta !== "scelta") return;
    if (n === stato.totale) {
      rispostaGiustaRiporto();
      return;
    }
    if (!stato.sbagliate.includes(n)) stato.sbagliate.push(n);
    stato.messaggio = "No, riprova! Conta 10 nella scatola più il riporto.";
    renderRiporto();
  }

  // --- Trascinamento (mouse e touch) e tocco: pezzo -> zona ---

  function zonaSottoPuntatore(x, y) {
    const e = document.elementFromPoint(x, y);
    return e ? e.closest("[data-zona]") : null;
  }

  function evidenziaZonaDrop(card) {
    $$(".riporto-card.zona-drop").forEach((c) => {
      if (c !== card) c.classList.remove("zona-drop");
    });
    if (card) card.classList.add("zona-drop");
  }

  function annullaDragRiporto() {
    document.removeEventListener("pointermove", mossaPuntatoreRiporto);
    document.removeEventListener("pointerup", rilascioPuntatoreRiporto);
    document.removeEventListener("pointercancel", annullaDragRiporto);
    if (riportoDrag && riportoDrag.clone) riportoDrag.clone.remove();
    evidenziaZonaDrop(null);
    riportoDrag = null;
  }

  function pressionePuntatoreRiporto(e) {
    if (!stato || stato.tipo !== "riporto" || stato.fase === "finito") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pezzoEl = e.target.closest(".pezzo");
    if (!pezzoEl) return;
    // Se si preme proprio su una linea di taglio: serve un DOPPIO tocco/click
    // (sulla stessa linea) per spezzare il pezzo; un tocco singolo vale come
    // toccare il pezzo e trascinando si sposta tutto il pezzo.
    const taglioEl = e.target.closest(".taglio");
    annullaDragRiporto();
    const rect = pezzoEl.getBoundingClientRect();
    riportoDrag = {
      id: Number(pezzoEl.dataset.id),
      taglio: taglioEl ? Number(taglioEl.dataset.k) : null,
      origine: pezzoEl,
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      attivo: false,
      clone: null,
    };
    document.addEventListener("pointermove", mossaPuntatoreRiporto);
    document.addEventListener("pointerup", rilascioPuntatoreRiporto);
    document.addEventListener("pointercancel", annullaDragRiporto);
  }

  function mossaPuntatoreRiporto(e) {
    const d = riportoDrag;
    if (!d) return;
    if (!d.attivo) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < SOGLIA_DRAG_PX) return;
      d.attivo = true;
      const clone = d.origine.cloneNode(true);
      clone.classList.remove("selezionato");
      clone.classList.add("pezzo--drag");
      clone.querySelectorAll(".taglio").forEach((t) => t.remove());
      document.body.appendChild(clone);
      d.clone = clone;
      d.origine.classList.add("trascinato");
    }
    d.clone.style.left = e.clientX - d.offX + "px";
    d.clone.style.top = e.clientY - d.offY + "px";
    evidenziaZonaDrop(zonaSottoPuntatore(e.clientX, e.clientY));
  }

  function rilascioPuntatoreRiporto(e) {
    const d = riportoDrag;
    if (!d) return;
    const attivo = d.attivo;
    const id = d.id;
    const card = attivo ? zonaSottoPuntatore(e.clientX, e.clientY) : null;
    annullaDragRiporto();
    if (attivo) {
      riportoUltimoTaglio = null;
      riportoUltimoDragMs = performance.now();
      if (card) muoviPezzoRiporto(id, card.dataset.zona);
      else renderRiporto();
      return;
    }
    // Se c'e' gia' un pezzo sollevato e si tocca un pezzo di un'altra zona, vale
    // come toccare quella zona (il pezzo sollevato ci viene spostato).
    const sollevato = stato.selezionato !== null ? trovaPezzoRiporto(stato.selezionato) : null;
    const toccato = trovaPezzoRiporto(id);
    if (sollevato && toccato && sollevato.zona !== toccato.zona) {
      muoviPezzoRiporto(stato.selezionato, toccato.zona);
      return;
    }
    if (d.taglio !== null) {
      const ora = performance.now();
      const u = riportoUltimoTaglio;
      if (u && u.id === id && u.k === d.taglio && ora - u.t <= DOPPIO_TAGLIO_MS) {
        riportoUltimoTaglio = null;
        spezzaPezzoRiporto(id, d.taglio);
        return;
      }
      riportoUltimoTaglio = { id, k: d.taglio, t: ora };
    } else {
      riportoUltimoTaglio = null;
    }
    // Tocco semplice: il pezzo si solleva (o si rimette giu'); poi si tocca la zona.
    stato.selezionato = stato.selezionato === id ? null : id;
    renderRiporto();
  }

  function clickRiporto(e) {
    if (!stato || stato.tipo !== "riporto" || stato.fase === "finito") return;
    if (performance.now() - riportoUltimoDragMs < 100) return;
    if (e.target.closest(".pezzo") || e.target.closest(".riporto-risposta")) return;
    const card = e.target.closest("[data-zona]");
    if (card && stato.selezionato !== null) muoviPezzoRiporto(stato.selezionato, card.dataset.zona);
  }

  function costruisciNumeriRiporto() {
    const riempi = (contenitore, n) => {
      contenitore.innerHTML = "";
      for (let i = 1; i <= n; i++) {
        const sp = document.createElement("span");
        sp.textContent = String(i);
        contenitore.appendChild(sp);
      }
    };
    riempi(el.riportoNumeriScatola, CELLE_SCATOLA);
    riempi(el.riportoNumeriRiporto, CELLE_RIPORTO);
  }

  // ---------- Uscita dal gioco ----------

  function esciDalGioco() {
    clearInterval(timerIntervalId);
    annullaDragRiporto();
    if (window.AscoltoFrase) window.AscoltoFrase.ferma();
    if (window.Ascolto) window.Ascolto.chiudi();
    if (window.FinePartita) window.FinePartita.chiudi();
    stato = null;
    renderHome();
    mostraSchermo("home");
  }

  // ---------- Fine partita: modale con tempo e stelline (condiviso) ----------

  // Apre la finestra di fine partita sopra il gioco appena finito, assegna le
  // stelline (una sola volta per partita) e offre solo 3 scelte.
  // Come mostraModaleFine, ma dopo un attimo (si vede l'ultima risposta giusta
  // diventare verde). Se nel frattempo si preme Ricomincia/Esci, non si apre.
  function mostraModaleFineTra(ms) {
    const partita = stato;
    setTimeout(() => {
      if (stato === partita && !partita.inCorso && partita.accumulatoMs > 0) mostraModaleFine();
    }, ms);
  }

  function mostraModaleFine() {
    if (!stato || !window.FinePartita || window.FinePartita.aperta()) return;
    const gioco = GAMES.find((g) => g.id === stato.gameId);
    const soglie = (gioco && gioco.soglieStelle) || window.Giocatore.SOGLIE_STELLE_SECONDI;
    const tempoFinale = tempoTrascorsoMs();
    const stelle = window.Giocatore.stelleDaTempo(tempoFinale, soglie);
    window.Giocatore.aggiungiStelle(stato.gameId, stelle);

    window.FinePartita.mostra({
      gioco: gioco ? `${gioco.emoji} ${gioco.titolo}` : "",
      tempo: tempoFinale,
      stelle,
      soglie,
      ripeti: ricominciaDaRisultati,
      nuova: nuovaSfidaDaRisultati,
      esci: esciDalGioco,
    });
  }

  function ricominciaDaRisultati() {
    if (!stato) return;
    if (stato.tipo === "lettura") ricominciaLettura();
    else if (stato.tipo === "fette") ricominciaFette();
    else if (stato.tipo === "lettere") ricominciaLettereSpeculari();
    else if (stato.tipo === "riporto") ricominciaRiporto();
    else ricominciaAbbinamento();
  }

  function nuovaSfidaDaRisultati() {
    if (!stato) return;
    if (stato.tipo === "lettura") nuovaSfidaLettura();
    else if (stato.tipo === "fette") nuovaSfidaFette();
    else if (stato.tipo === "lettere") nuovaSfidaLettereSpeculari();
    else if (stato.tipo === "riporto") nuovaSfidaRiporto();
    else nuovaSfidaAbbinamento();
  }

  // ---------- Avvio ----------

  function init() {
    renderHome();
    mostraSchermo("home");

    // gioco 1
    el.btnPausa.addEventListener("click", togglePausa);
    el.btnRicomincia.addEventListener("click", ricominciaLettura);
    el.btnNuovaSfida.addEventListener("click", nuovaSfidaLettura);
    el.btnFine.addEventListener("click", finisciLettura);
    el.btnEsci.addEventListener("click", esciDalGioco);

    // gioco 2
    el.abbinaBtnRicomincia.addEventListener("click", ricominciaAbbinamento);
    el.abbinaBtnNuovaSfida.addEventListener("click", nuovaSfidaAbbinamento);
    el.abbinaBtnEsci.addEventListener("click", esciDalGioco);

    // gioco 5: parola a fette
    el.fetteBtnRicomincia.addEventListener("click", ricominciaFette);
    el.fetteBtnNuovaSfida.addEventListener("click", nuovaSfidaFette);
    el.fetteBtnEsci.addEventListener("click", esciDalGioco);

    // gioco 6: lettere speculari
    el.lettereBtnRicomincia.addEventListener("click", ricominciaLettereSpeculari);
    el.lettereBtnNuovaSfida.addEventListener("click", nuovaSfidaLettereSpeculari);
    el.lettereBtnEsci.addEventListener("click", esciDalGioco);

    // gioco 7: somme col riporto
    costruisciNumeriRiporto();
    el.riportoBtnRicomincia.addEventListener("click", ricominciaRiporto);
    el.riportoBtnNuovaSfida.addEventListener("click", nuovaSfidaRiporto);
    el.riportoBtnControlla.addEventListener("click", controllaRiporto);
    el.riportoBtnEsci.addEventListener("click", esciDalGioco);
    el.riportoContenuto.addEventListener("pointerdown", pressionePuntatoreRiporto);
    el.riportoContenuto.addEventListener("click", clickRiporto);
    el.riportoOptNumeri.addEventListener("change", () => {
      riportoMostraNumeri = el.riportoOptNumeri.checked;
      if (stato && stato.tipo === "riporto") renderRiporto();
    });

    // giocatore: toccando l'avatar se ne genera uno nuovo (stesso id di sessione)
    el.homeUtente.addEventListener("click", rigeneraAvatar);
    el.homeStelle.addEventListener("click", toccoTotaleStelle);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
