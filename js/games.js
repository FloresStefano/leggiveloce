/*
 * Elenco dei giochi disponibili nell'app.
 * Ogni gioco attivo deve avere un file dati corrispondente in js/games/<id>.js
 * che esporta l'elenco di parole usato da quel gioco (vedi bisillabe-piane-semplici.js).
 *
 * Per aggiungere un nuovo gioco in futuro:
 * 1. Creare js/games/<nuovo-id>.js con i dati.
 * 2. Aggiungere qui una voce con attivo:true.
 * 3. Collegare i dati in GAME_DATA (in app.js).
 */

const GAMES = [
  {
    id: "bisillabe-piane-semplici",
    titolo: "Leggi bisillabe piane semplici",
    emoji: "🔤",
    colore: "#3fb984",
    descrizione: "10 parole a due sillabe: leggile tutte più veloce che puoi.",
    attivo: true,
  },
  {
    id: "prossimo-1",
    titolo: "Prossimamente",
    emoji: "🔒",
    colore: "#b9b3ad",
    descrizione: "Un nuovo gioco è in arrivo.",
    attivo: false,
  },
  {
    id: "prossimo-2",
    titolo: "Prossimamente",
    emoji: "🔒",
    colore: "#b9b3ad",
    descrizione: "Un nuovo gioco è in arrivo.",
    attivo: false,
  },
];
