/*
 * Elenco dei giochi disponibili nell'app.
 * Ogni gioco attivo deve avere un file dati corrispondente in js/games/<id>.js
 * che esporta l'elenco di parole usato da quel gioco (vedi bisillabe-piane-semplici.js).
 *
 * "tipo" dice ad app.js quale meccanica usare per avviare il gioco:
 * - "lettura": griglia di 10 parole + cronometro + conto alla rovescia (Gioco 1, Gioco 3)
 * - "abbinamento": due colonne da abbinare + cronometro (Gioco 2)
 * - "frase": stessa meccanica di "lettura" ma con un'unica frase completa
 *   (6-15 parole, ordine fisso) al posto di 10 parole casuali (Gioco 4)
 *
 * Per aggiungere un nuovo gioco in futuro con una meccanica NUOVA, serve
 * anche scrivere la logica corrispondente in js/app.js: "tipo" qui deve
 * combaciare con quello che app.js sa gestire.
 */

const GAMES = [
  {
    id: "bisillabe-piane-semplici",
    titolo: "Leggi bisillabe piane semplici",
    emoji: "🔤",
    colore: "#3fb984",
    descrizione: "10 parole a due sillabe: leggile tutte più veloce che puoi.",
    tipo: "lettura",
    attivo: true,
  },
  {
    id: "combina-bisillabe",
    titolo: "Combina bisillabe",
    emoji: "🧩",
    colore: "#5b8dee",
    descrizione: "Unisci le due metà e forma le parole più veloce che puoi.",
    tipo: "abbinamento",
    attivo: true,
  },
  {
    id: "trisillabe-piane",
    titolo: "Leggi trisillabe piane",
    emoji: "📚",
    colore: "#e0a530",
    descrizione: "10 parole a tre sillabe: leggile tutte più veloce che puoi.",
    tipo: "lettura",
    attivo: true,
  },
  {
    id: "leggi-frase",
    titolo: "Leggi una frase",
    emoji: "📝",
    colore: "#8a63d2",
    descrizione: "Leggi tutta la frase, parola per parola, più veloce che puoi.",
    tipo: "frase",
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
];
