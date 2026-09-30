/*
 * Parole per il gioco "Lettere speculari" (b/d/p/q).
 *
 * Ogni parola contiene UNA SOLA delle 4 lettere speculari (mai due o più,
 * per evitare ambiguità: es. "spada" non è usata perché ha sia la "p" che
 * la "d"). La lettera può comparire come iniziale della parola o al suo
 * interno ("nel mezzo"), anche più volte, purché sia sempre la stessa.
 *
 * Il pool per ogni lettera è più ampio delle 6 parole mostrate in una
 * partita (24 parole totali = 6 per lettera), così "Nuova sfida" pesca
 * ogni volta una combinazione diversa.
 */

const PAROLE_LETTERE_SPECULARI = {
  b: [
    { parola: "barca" },
    { parola: "banana" },
    { parola: "balena" },
    { parola: "borsa" },
    { parola: "bambola" },
    { parola: "albero" },
    { parola: "barba" },
    { parola: "sabbia" },
    { parola: "gamba" },
    { parola: "libro" },
    { parola: "nebbia" },
  ],
  d: [
    { parola: "dado" },
    { parola: "dente" },
    { parola: "delfino" },
    { parola: "candela" },
    { parola: "edera" },
    { parola: "radio" },
    { parola: "dito" },
    { parola: "corda" },
    { parola: "medaglia" },
    { parola: "giardino" },
  ],
  p: [
    { parola: "pane" },
    { parola: "porta" },
    { parola: "pesce" },
    { parola: "scarpa" },
    { parola: "lupo" },
    { parola: "pupazzo" },
    { parola: "penna" },
    { parola: "campana" },
    { parola: "lampo" },
    { parola: "pollo" },
  ],
  q: [
    { parola: "acqua" },
    { parola: "quattro" },
    { parola: "quercia" },
    { parola: "quaglia" },
    { parola: "acquario" },
    { parola: "squalo" },
    { parola: "cinque" },
    { parola: "quaranta" },
  ],
};
