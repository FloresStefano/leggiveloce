/*
 * Contenuti del gioco "Leggo a Tempo".
 * Ogni livello ha un elenco di "schede": brevi gruppi di parole (frasi)
 * che il bambino deve leggere prima che il tempo scada.
 *
 * Per aggiungere nuove schede basta aggiungere nuove stringhe nell'array
 * "schede" del livello desiderato. Non serve toccare altro codice.
 *
 * displayMs = quanto tempo (in millisecondi) resta visibile ogni scheda.
 */

const LEVELS = [
  {
    id: "facile",
    nome: "Facile",
    emoji: "🐣",
    colore: "#3fb984",
    displayMs: 3200,
    descrizione: "Coppie di parole semplici, tempo lungo.",
    schede: [
      "il gatto", "la casa", "il sole", "la mamma", "il papà",
      "il cane", "la luna", "il pane", "il mare", "il fiore",
      "la palla", "il letto", "il naso", "la mano", "la sedia",
      "il latte", "il topo", "la pizza", "il libro", "la scuola",
      "l'amico", "la stella", "il treno", "la torta"
    ]
  },
  {
    id: "medio",
    nome: "Medio",
    emoji: "🐥",
    colore: "#f2a93b",
    displayMs: 2300,
    descrizione: "Piccole frasi di tre parole.",
    schede: [
      "il gatto nero", "la mamma canta", "un cane felice", "il sole splende",
      "la luna piena", "un fiore giallo", "la torta buona", "il treno veloce",
      "una stella brillante", "il pane caldo", "la scuola bella", "un libro nuovo",
      "la palla rossa", "il mare azzurro", "un amico caro", "la pioggia cade",
      "il vento soffia", "una farfalla vola", "il bambino corre", "la nonna sorride"
    ]
  },
  {
    id: "difficile",
    nome: "Difficile",
    emoji: "🦅",
    colore: "#e0563f",
    displayMs: 1700,
    descrizione: "Frasi più lunghe, tempo breve.",
    schede: [
      "il gatto nero dorme", "la mamma prepara la torta", "un cane corre nel prato",
      "il sole splende nel cielo", "la luna illumina la notte", "i fiori crescono in giardino",
      "la torta profuma di vaniglia", "il treno arriva in stazione", "le stelle brillano di notte",
      "il pane caldo profuma tanto", "la scuola è vicino a casa", "il libro racconta una storia",
      "la palla rimbalza sul prato", "il mare è calmo e blu", "gli amici giocano nel cortile",
      "la pioggia bagna le strade", "il vento muove le foglie", "la farfalla vola sui fiori",
      "il bambino legge un libro", "la nonna racconta una favola"
    ]
  }
];

// Parole "vuote" da evitare come risposta nella mini-verifica
const PAROLE_FUNZIONE = new Set([
  "il", "lo", "la", "l'", "i", "gli", "le", "un", "una", "uno",
  "di", "a", "da", "in", "con", "su", "per", "tra", "fra", "e", "è"
]);
