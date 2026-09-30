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
 * - "fette": parola target + scelta di una delle sue 3 sillabe + ricerca
 *   delle 7 parole che condividono quella sillaba, con cronometro e conto
 *   alla rovescia (Gioco 5)
 * - "lettere": scelta di una lettera speculare (b/d/p/q) + ricerca delle 6
 *   parole che contengono proprio quella lettera, con cronometro e conto
 *   alla rovescia (Gioco 6)
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
    id: "parola-a-fette",
    titolo: "Parola a fette",
    emoji: "🍕",
    colore: "#1fa5a5",
    descrizione: "Scegli una sillaba e trova le 7 parole che la condividono, più veloce che puoi.",
    tipo: "fette",
    attivo: true,
  },
  {
    id: "lettere-speculari",
    titolo: "Lettere speculari",
    emoji: "🔁",
    colore: "#d1495b",
    descrizione: "Scegli una lettera (b/d/p/q) e trova le 6 parole che la contengono, più veloce che puoi.",
    tipo: "lettere",
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
