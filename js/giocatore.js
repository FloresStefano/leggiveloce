/*
 * Giocatore: l'"utente" della sessione di gioco, il suo avatar e le stelline.
 *
 * Non c'e' nessun login ne' nome da digitare: a ogni sessione web e' legato
 * UN giocatore casuale (un id di sessione, un soprannome tipo "Panda Allegro"
 * e un avatar). La relazione e' 1:1: l'avatar e' sempre calcolato dall'id di
 * sessione (piu' un contatore, che cresce solo se si tocca l'avatar per
 * rigenerarlo), quindi lo stesso id mostra sempre lo stesso avatar.
 *
 * Tutto vive in localStorage (nessun database): chiave "leggoATempo:giocatore:v1".
 * Se il browser non permette di salvare, l'app funziona lo stesso ma l'id e le
 * stelle durano solo finche' la pagina resta aperta.
 *
 * L'avatar e' generato in locale (stile Avataaars, libreria in js/vendor):
 * nessuna immagine viene scaricata da servizi esterni.
 */
(function () {
  "use strict";

  const STORAGE_GIOCATORE = "leggoATempo:giocatore:v1";

  // Stelline: 3 sotto 10 secondi, 2 sotto 20, 1 sotto 30, 0 oltre.
  // Un gioco puo' avere soglie sue con `soglieStelle: [a, b, c]` in games.js.
  const SOGLIE_STELLE_SECONDI = [10, 20, 30];

  // Avatar "per bambini": sempre sorridente/simpatico, niente barba/baffi,
  // niente teschi.
  const OPZIONI_AVATAR = {
    style: ["circle"],
    backgroundColor: ["b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf", "c8f2d4"],
    facialHairProbability: 0,
    accessoriesProbability: 25,
    mouth: ["default", "smile", "twinkle", "tongue", "eating"],
    eyes: ["default", "happy", "hearts", "wink", "surprised", "winkWacky"],
    eyebrows: ["default", "defaultNatural", "raisedExcited", "raisedExcitedNatural", "upDown", "upDownNatural", "flatNatural"],
    clothingGraphic: ["bear", "deer", "diamond", "pizza", "hola", "bat"],
  };

  // Soprannomi: animale + aggettivo, con l'accordo maschile/femminile.
  const ANIMALI = [
    ["Panda", "m"], ["Leone", "m"], ["Gufo", "m"], ["Delfino", "m"], ["Koala", "m"],
    ["Riccio", "m"], ["Coniglio", "m"], ["Pinguino", "m"], ["Tigrotto", "m"], ["Orsetto", "m"],
    ["Volpe", "f"], ["Tartaruga", "f"], ["Giraffa", "f"], ["Farfalla", "f"], ["Civetta", "f"],
    ["Rondine", "f"], ["Balena", "f"], ["Foca", "f"], ["Lontra", "f"], ["Scimmietta", "f"],
  ];
  const AGGETTIVI = [
    ["Allegro", "Allegra"], ["Veloce", "Veloce"], ["Curioso", "Curiosa"], ["Coraggioso", "Coraggiosa"],
    ["Simpatico", "Simpatica"], ["Furbo", "Furba"], ["Gentile", "Gentile"], ["Brillante", "Brillante"],
    ["Felice", "Felice"], ["Forte", "Forte"], ["Birichino", "Birichina"], ["Dolce", "Dolce"],
  ];

  function hash(testo) {
    // FNV-1a a 32 bit: serve solo a scegliere in modo ripetibile dall'id.
    let h = 0x811c9dc5;
    for (let i = 0; i < testo.length; i++) {
      h ^= testo.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function nuovoId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    } catch (e) { /* ignora */ }
    let id = "";
    for (let i = 0; i < 4; i++) id += Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
    return id;
  }

  let dati = null;

  function carica() {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_GIOCATORE));
      if (d && typeof d.id === "string" && d.id) {
        d.avatar = Number.isInteger(d.avatar) ? d.avatar : 0;
        d.stelle = d.stelle && typeof d.stelle === "object" ? d.stelle : {};
        return d;
      }
    } catch (e) { /* ignora */ }
    return null;
  }

  function salva() {
    try {
      localStorage.setItem(STORAGE_GIOCATORE, JSON.stringify(dati));
    } catch (e) {
      /* storage non disponibile: si continua in memoria */
    }
  }

  function assicura() {
    if (dati) return dati;
    dati = carica();
    if (!dati) {
      dati = { id: nuovoId(), avatar: 0, stelle: {} };
      salva();
    }
    return dati;
  }

  const Giocatore = {
    SOGLIE_STELLE_SECONDI,

    id() {
      return assicura().id;
    },

    /** Soprannome casuale ma fisso per questa sessione, es. "Panda Allegro". */
    nome() {
      const h = hash(assicura().id);
      const [animale, genere] = ANIMALI[h % ANIMALI.length];
      const agg = AGGETTIVI[Math.floor(h / ANIMALI.length) % AGGETTIVI.length];
      return animale + " " + (genere === "f" ? agg[1] : agg[0]);
    },

    /** Immagine dell'avatar come data URI SVG (nessuna richiesta di rete). */
    avatarSrc() {
      const d = assicura();
      const gen = window.DiceBearAvataaars;
      if (!gen) return "";
      try {
        const svg = gen.svg(d.id + ":" + d.avatar, OPZIONI_AVATAR);
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      } catch (e) {
        return "";
      }
    },

    /** Rigenera l'avatar (stesso id di sessione, nuovo aspetto). */
    rigeneraAvatar() {
      assicura().avatar++;
      salva();
    },

    /** Stelline guadagnate in un gioco. */
    stelleGioco(gameId) {
      return assicura().stelle[gameId] || 0;
    },

    /** Stelline guadagnate in tutti i giochi. */
    stelleTotali() {
      const s = assicura().stelle;
      return Object.keys(s).reduce((somma, k) => somma + (s[k] || 0), 0);
    },

    aggiungiStelle(gameId, n) {
      if (!(n > 0)) return;
      const d = assicura();
      d.stelle[gameId] = (d.stelle[gameId] || 0) + n;
      salva();
    },

    /** Da tempo (ms) a stelline (0-3). */
    stelleDaTempo(tempoMs, soglie) {
      const sec = tempoMs / 1000;
      const s = soglie && soglie.length === 3 ? soglie : SOGLIE_STELLE_SECONDI;
      if (sec < s[0]) return 3;
      if (sec < s[1]) return 2;
      if (sec < s[2]) return 1;
      return 0;
    },
  };

  window.Giocatore = Giocatore;
})();
