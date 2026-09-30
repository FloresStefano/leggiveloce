(function () {
  "use strict";

  const PAROLE_PER_PARTITA_LETTURA = 10;
  const PAROLE_PER_PARTITA_ABBINAMENTO = 8;
  const STORAGE_RECORDS = "leggoATempo:records:v2";
  const STORAGE_NOMI = "leggoATempo:nomi";
  const MAX_NOMI_RICORDATI = 12;
  const COUNTDOWN_STEPS = ["3", "2", "1", "VIA!"];
  const COUNTDOWN_STEP_MS = 700;

  // Collega ogni gioco attivo al proprio elenco di parole.
  const PAROLE_PER_PARTITA_FETTE = 7;

  const GAME_DATA = {
    "bisillabe-piane-semplici": PAROLE_BISILLABE_PIANE,
    "combina-bisillabe": PAROLE_BISILLABE_PIANE,
    "trisillabe-piane": PAROLE_TRISILLABE_PIANE,
    "leggi-frase": FRASI,
    "parola-a-fette": PAROLE_A_FETTE,
  };

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const schermi = {
    home: $("#schermo-home"),
    gioco: $("#schermo-gioco"),
    abbina: $("#schermo-abbina"),
    fette: $("#schermo-fette"),
    risultati: $("#schermo-risultati"),
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
    // risultati
    risultatiTempo: $("#risultati-tempo"),
    risultatiMessaggio: $("#risultati-messaggio"),
    nomeInput: $("#nome-input"),
    nomeChips: $("#nome-chips"),
    btnSalva: $("#btn-salva-record"),
    btnNonSalvare: $("#btn-non-salvare"),
    salvaConferma: $("#salva-conferma"),
    btnRiprova: $("#btn-riprova"),
    btnNuoveParole: $("#btn-nuove-parole"),
    btnRisultatiEsci: $("#btn-risultati-esci"),
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

  // ---------- Salvataggio record (localStorage) ----------

  function leggiRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RECORDS)) || {};
    } catch (e) {
      return {};
    }
  }

  function salvaRecords(records) {
    try {
      localStorage.setItem(STORAGE_RECORDS, JSON.stringify(records));
    } catch (e) {
      /* storage non disponibile: si continua senza salvare */
    }
  }

  function leggiNomiRicordati() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_NOMI)) || [];
    } catch (e) {
      return [];
    }
  }

  function ricordaNome(nome) {
    let nomi = leggiNomiRicordati().filter(
      (n) => n.toLowerCase() !== nome.toLowerCase()
    );
    nomi.unshift(nome);
    nomi = nomi.slice(0, MAX_NOMI_RICORDATI);
    try {
      localStorage.setItem(STORAGE_NOMI, JSON.stringify(nomi));
    } catch (e) {
      /* ignora */
    }
    return nomi;
  }

  // Salva il tempo solo se e' un nuovo record per quel bambino in quel gioco.
  function salvaRecordSeMigliore(gameId, nome, tempoMs) {
    const records = leggiRecords();
    if (!records[gameId]) records[gameId] = {};
    const chiave = nome.toLowerCase();
    const esistente = records[gameId][chiave];

    if (!esistente || tempoMs < esistente.tempoMs) {
      records[gameId][chiave] = {
        nome,
        tempoMs,
        data: new Date().toISOString(),
      };
      salvaRecords(records);
      return { nuovoRecord: true, precedente: esistente ? esistente.tempoMs : null };
    }
    return { nuovoRecord: false, precedente: esistente.tempoMs };
  }

  function classificaGioco(gameId) {
    const records = leggiRecords()[gameId] || {};
    return Object.values(records).sort((a, b) => a.tempoMs - b.tempoMs);
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
    el.listaGiochi.innerHTML = "";
    GAMES.forEach((gioco) => {
      const card = document.createElement("div");
      card.className = "gioco-card" + (gioco.attivo ? "" : " gioco-card--disabilitato");
      card.style.setProperty("--gioco-colore", gioco.colore);

      const classifica = gioco.attivo ? classificaGioco(gioco.id) : [];
      const classificaHtml = gioco.attivo ? renderClassificaHtml(classifica) : "";

      card.innerHTML = `
        <button class="gioco-card__avvia" ${gioco.attivo ? "" : "disabled"}>
          <span class="gioco-card__emoji">${gioco.emoji}</span>
          <span class="gioco-card__titolo">${gioco.titolo}</span>
          <span class="gioco-card__desc">${gioco.descrizione}</span>
        </button>
        ${classificaHtml}
      `;

      if (gioco.attivo) {
        $(".gioco-card__avvia", card).addEventListener("click", () =>
          avviaGiocoDaHome(gioco.id)
        );
      }

      el.listaGiochi.appendChild(card);
    });
  }

  function renderClassificaHtml(classifica) {
    if (!classifica.length) {
      return `<p class="classifica-vuota">Nessun record ancora: sii il primo a giocare!</p>`;
    }
    const medaglie = ["🥇", "🥈", "🥉"];
    const righe = classifica
      .slice(0, 8)
      .map((r, i) => {
        const medaglia = medaglie[i] || `${i + 1}.`;
        return `<li><span class="classifica-pos">${medaglia}</span><span class="classifica-nome">${escapeHtml(
          r.nome
        )}</span><span class="classifica-tempo">${formattaTempo(
          r.tempoMs
        )}</span></li>`;
      })
      .join("");
    return `<ol class="classifica">${righe}</ol>`;
  }

  function avviaGiocoDaHome(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    if (!gioco || !gioco.attivo) return;
    if (gioco.tipo === "abbinamento") avviaAbbinamento(gameId);
    else if (gioco.tipo === "fette") avviaFette(gameId);
    else avviaLettura(gameId);
  }

  // ---------- Cronometro (condiviso tra i due giochi) ----------

  function tempoTrascorsoMs() {
    if (!stato) return 0;
    const inCorsoMs = stato.inCorso ? performance.now() - stato.inizioSegmento : 0;
    return stato.accumulatoMs + inCorsoMs;
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
  }

  function pausaCronometro() {
    if (!stato || !stato.inCorso) return;
    stato.accumulatoMs += performance.now() - stato.inizioSegmento;
    stato.inCorso = false;
    stato.inizioSegmento = null;
    clearInterval(timerIntervalId);
    aggiornaDisplayCronometro();
    if (stato.tipo === "lettura") el.btnPausa.textContent = "▶️ Riprendi";
  }

  function togglePausa() {
    if (!stato || stato.tipo !== "lettura") return;
    if (stato.inCorso) pausaCronometro();
    else avviaCronometro();
  }

  // ---------- GIOCO 1: Leggi bisillabe piane semplici ----------

  // Sceglie le parole/blocchetti da mostrare per un gioco di tipo "lettura"
  // o "frase": per "frase" viene scelta un'unica frase intera (ordine fisso,
  // lunghezza propria della frase), per "lettura" un set di N parole casuali.
  function selezionaParoleGioco(gioco) {
    const pool = GAME_DATA[gioco.id];
    if (!pool) return null;
    if (gioco.tipo === "frase") {
      const frase = pool[Math.floor(Math.random() * pool.length)];
      return frase.slice();
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
    mostraSchermo("gioco");
    avviaCountdownESfocatura(() => avviaCronometro());
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
    mostraRisultati();
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
        mostraRisultati();
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

  function avviaFette(gameId) {
    const gioco = GAMES.find((g) => g.id === gameId);
    const pool = GAME_DATA[gameId];
    if (!gioco || !gioco.attivo || !pool || !pool.length) return;

    const fetta = pool[Math.floor(Math.random() * pool.length)];

    stato = {
      gameId,
      tipo: "fette",
      fetta,
      sillabaScelta: null,
      trovate: 0,
      accumulatoMs: 0,
      inCorso: false,
      inizioSegmento: null,
      cronometroEl: el.fetteCronometro,
    };

    el.fetteCronometro.textContent = formattaTempo(0);
    el.fetteMessaggio.textContent = "";
    renderFette(fetta);
    mostraSchermo("fette");
    avviaCountdownFette(() => avviaCronometro());
  }

  function renderFette(fetta) {
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

    const paroleMescolate = mescola(fetta.parole);
    el.fetteParoleGriglia.innerHTML = "";
    paroleMescolate.forEach((p) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "abbina-tile";
      tile.textContent = p.parola;
      tile.addEventListener("click", () => gestisciClickParolaFette(p.posizione, tile));
      el.fetteParoleGriglia.appendChild(tile);
    });
  }

  // Sceglie quale sillaba (1, 2 o 3) usare per questa partita: una volta
  // scelta resta fissa per tutta la partita (non si puo' cambiare idea).
  function scegliSillabaFette(posizione, elemento) {
    if (!stato || stato.tipo !== "fette" || stato.sillabaScelta) return;
    stato.sillabaScelta = posizione;
    $$(".abbina-tile", el.fetteSillabeScelta).forEach((t) => {
      t.disabled = true;
    });
    elemento.classList.add("selezionata");
    el.fetteMessaggio.textContent = "";
  }

  function gestisciClickParolaFette(posizioneParola, elemento) {
    if (!stato || stato.tipo !== "fette") return;
    if (elemento.classList.contains("corretta")) return;

    if (!stato.sillabaScelta) {
      el.fetteMessaggio.textContent = "Scegli prima una sillaba qui sopra!";
      return;
    }

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
        mostraRisultati();
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
    stato.trovate = 0;
    el.fetteCronometro.textContent = formattaTempo(0);
    el.fetteMessaggio.textContent = "";
    renderFette(stato.fetta);
    mostraSchermo("fette");
    avviaCountdownFette(() => avviaCronometro());
  }

  function nuovaSfidaFette() {
    if (!stato) return;
    avviaFette(stato.gameId);
  }

  // ---------- Uscita dal gioco ----------

  function esciDalGioco() {
    clearInterval(timerIntervalId);
    stato = null;
    renderHome();
    mostraSchermo("home");
  }

  // ---------- Risultati / salvataggio (condivisi) ----------

  function mostraRisultati() {
    const tempoFinale = tempoTrascorsoMs();
    el.risultatiTempo.textContent = formattaTempo(tempoFinale);
    el.risultatiMessaggio.textContent = "";
    el.salvaConferma.textContent = "";

    const nomi = leggiNomiRicordati();
    el.nomeInput.value = nomi[0] || "";
    renderNomeChips(nomi);

    mostraSchermo("risultati");
  }

  function renderNomeChips(nomi) {
    el.nomeChips.innerHTML = "";
    nomi.forEach((nome) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip-nome";
      chip.textContent = nome;
      chip.addEventListener("click", () => {
        el.nomeInput.value = nome;
      });
      el.nomeChips.appendChild(chip);
    });
  }

  function salvaRecordCorrente() {
    if (!stato) return;
    const nome = el.nomeInput.value.trim();
    if (!nome) {
      el.salvaConferma.textContent = "Scrivi il tuo nome prima di salvare 🙂";
      el.salvaConferma.style.color = "var(--error)";
      return;
    }

    const tempoFinale = tempoTrascorsoMs();
    const esito = salvaRecordSeMigliore(stato.gameId, nome, tempoFinale);
    ricordaNome(nome);
    renderNomeChips(leggiNomiRicordati());

    if (esito.nuovoRecord && esito.precedente === null) {
      el.salvaConferma.textContent = `🎉 Primo record salvato per ${nome}!`;
      el.salvaConferma.style.color = "var(--success)";
    } else if (esito.nuovoRecord) {
      el.salvaConferma.textContent = `🏆 Nuovo record per ${nome}! Prima: ${formattaTempo(
        esito.precedente
      )}`;
      el.salvaConferma.style.color = "var(--success)";
    } else {
      el.salvaConferma.textContent = `Il record di ${nome} resta ${formattaTempo(
        esito.precedente
      )} (questo tentativo: ${formattaTempo(tempoFinale)})`;
      el.salvaConferma.style.color = "var(--ink)";
    }
  }

  function nonSalvareRecord() {
    el.salvaConferma.textContent = "Ok, tempo non salvato.";
    el.salvaConferma.style.color = "var(--ink)";
  }

  function ricominciaDaRisultati() {
    if (!stato) return;
    if (stato.tipo === "lettura") ricominciaLettura();
    else if (stato.tipo === "fette") ricominciaFette();
    else ricominciaAbbinamento();
  }

  function nuovaSfidaDaRisultati() {
    if (!stato) return;
    if (stato.tipo === "lettura") nuovaSfidaLettura();
    else if (stato.tipo === "fette") nuovaSfidaFette();
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

    // risultati (condivisi)
    el.btnSalva.addEventListener("click", salvaRecordCorrente);
    el.btnNonSalvare.addEventListener("click", nonSalvareRecord);
    el.btnRiprova.addEventListener("click", ricominciaDaRisultati);
    el.btnNuoveParole.addEventListener("click", nuovaSfidaDaRisultati);
    el.btnRisultatiEsci.addEventListener("click", esciDalGioco);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
