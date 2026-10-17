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
 *   delle 5 parole che condividono quella sillaba, con cronometro e conto
 *   alla rovescia (Gioco 5)
 * - "lettere": scelta di una lettera speculare (b/d/p/q) + ricerca delle 5
 *   parole che contengono proprio quella lettera, con cronometro e conto
 *   alla rovescia (Gioco 6)
 * - "riporto": somma con riporto da fare con i bastoncini (si spezzano, si
 *   trascinano nella scatola da 10 e in quella del riporto) + scelta del
 *   risultato; non usa nessun file di parole (Gioco 7)
 * - "tabelline": una tabellina intera (da 2 a 9) per partita: 10 operazioni in ordine, da dire
 *   ad alta voce con il risultato ("tre per quattro dodici"); ogni frase
 *   giusta evidenzia il suo blocchetto; non usa nessun file di parole (Gioco 8)
 * - "torre": Torre di parole (Gioco 9): 100 parole (bisillabe e trisillabe dei Giochi 1 e 3)
 *   cadono una alla volta e si impilano in una colonna; dette ad alta voce
 *   esplodono (la torre si assesta). Si perde con 10 blocchetti impilati.
 *   Stelline: una ogni 10 parole fatte esplodere (da 0 a 10), non dal tempo.
 * - "muraglia": Muraglia cinese (Gioco 10): un muro di 10 file di mattoni-parola
 *   (3-5 per fila). Una parola detta scompare per 15 secondi e poi torna. Sulla
 *   cima cammina una lumaca: se si apre un varco verticale (in tutte le file
 *   manca il mattone allo stesso punto) la lumaca cade e la partita e' persa.
 *   Si vince dicendo tutte le parole almeno una volta; stelline dal tempo, con
 *   soglie proporzionali al numero di mattoni (calcolate in app.js).
 *
 * "ascolto: true" attiva l'ascolto a voce opzionale di js/ascolto.js (giochi
 * di tipo "lettura", "frase", "fette" e "lettere"): interruttore "🎤 Ascolto" nella
 * schermata di gioco. Nei giochi "lettura"/"frase" le parole lette ad alta
 * voce si evidenziano (tocco = sente la parola, doppio tocco = segnata come
 * letta); in "fette" e "lettere" la voce seleziona le parole come se fossero toccate.
 *
 * "soglieStelle: [a, b, c]" (facoltativo) cambia per quel gioco i secondi
 * delle stelline: 3 stelline sotto a, 2 sotto b, 1 sotto c, 0 oltre
 * (di default [10, 20, 30], vedi js/giocatore.js).
 *
 * Per aggiungere un nuovo gioco in futuro con una meccanica NUOVA, serve
 * anche scrivere la logica corrispondente in js/app.js: "tipo" qui deve
 * combaciare con quello che app.js sa gestire.
 */

const GAMES = [
  {
    id: "bisillabe-piane-semplici",
    titolo: "Bisillabe",
    emoji: "🔤",
    colore: "#3fb984",
    descrizione: "10 parole a due sillabe: leggile tutte più veloce che puoi.",
    tipo: "lettura",
    ascolto: true,
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
    titolo: "Trisillabe",
    emoji: "📚",
    colore: "#e0a530",
    descrizione: "10 parole a tre sillabe: leggile tutte più veloce che puoi.",
    tipo: "lettura",
    ascolto: true,
    attivo: true,
  },
  {
    id: "leggi-frase",
    titolo: "Leggi una frase",
    emoji: "📝",
    colore: "#8a63d2",
    descrizione: "Leggi tutta la frase, parola per parola, più veloce che puoi.",
    tipo: "frase",
    ascolto: true,
    attivo: true,
  },
  {
    id: "parola-a-fette",
    titolo: "Parola a fette",
    emoji: "🍕",
    colore: "#1fa5a5",
    descrizione: "Scegli una sillaba e trova le 5 parole che la condividono, più veloce che puoi.",
    tipo: "fette",
    ascolto: true,
    attivo: true,
  },
  {
    id: "lettere-speculari",
    titolo: "Lettere speculari",
    emoji: "🔁",
    colore: "#d1495b",
    descrizione: "Scegli una lettera (b/d/p/q) e trova le 5 parole che la contengono, più veloce che puoi.",
    tipo: "lettere",
    ascolto: true,
    attivo: true,
  },
  {
    id: "somme-col-riporto",
    titolo: "Somme col riporto",
    emoji: "🧮",
    colore: "#f08a24",
    descrizione: "Spezza i bastoncini, riempi la scatola da 10 e trova il risultato, più veloce che puoi.",
    tipo: "riporto",
    attivo: true,
  },
  {
    id: "tabelline",
    titolo: "Tabelline",
    emoji: "✖️",
    colore: "#2f9bd8",
    descrizione: "Dì ad alta voce tutte le operazioni di una tabellina con il loro risultato, più veloce che puoi.",
    tipo: "tabelline",
    attivo: true,
    soglieStelle: [30, 45, 60],
  },
  {
    id: "torre-di-parole",
    titolo: "Torre di parole",
    emoji: "🧱",
    colore: "#7a5cd6",
    descrizione: "Le parole cadono e si impilano: dille ad alta voce per farle esplodere, prima che la torre arrivi in alto!",
    tipo: "torre",
    attivo: true,
  },
  {
    id: "muraglia-cinese",
    titolo: "Muraglia cinese",
    emoji: "🐌",
    colore: "#c0612b",
    descrizione: "Dì tutte le parole del muro, ma attento a non aprire un varco: la lumaca cadrebbe giù!",
    tipo: "muraglia",
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
