/*
 * Elenco per il gioco "Parola a fette".
 *
 * Ogni voce e':
 *   - parola / sillabe: la parola trisillaba mostrata in grande in alto,
 *     con la sua struttura sillabica sotto (come nelle altre "letture").
 *   - parole: 21 parole trisillabe "a fette" compatte, ciascuna con
 *     "posizione" 1, 2 o 3 a seconda di QUALE delle tre sillabe della
 *     parola target condivide (7 parole per ciascuna posizione). Ogni
 *     parola condivide UNA sola sillaba con la parola target, mai due,
 *     per evitare ambiguita' nel gioco.
 *
 * Scelte, sillabate e verificate a mano (via script) da Claude: le
 * parole condivise sono per lo piu' quelle degli altri due giochi di
 * lettura (bisillabe/trisillabe), con qualche parola trisillaba nuova
 * dove serviva completare un gruppo di 7.
 */

const PAROLE_A_FETTE = [
  {
    parola: "matita",
    sillabe: "ma-ti-ta",
    parole: [
      { parola: "maestra", posizione: 1 },
      { parola: "maestro", posizione: 1 },
      { parola: "maestre", posizione: 1 },
      { parola: "maiale", posizione: 1 },
      { parola: "maniglia", posizione: 1 },
      { parola: "marina", posizione: 1 },
      { parola: "maglione", posizione: 1 },
      { parola: "bottiglia", posizione: 2 },
      { parola: "bottiglie", posizione: 2 },
      { parola: "cortile", posizione: 2 },
      { parola: "cortili", posizione: 2 },
      { parola: "mattina", posizione: 2 },
      { parola: "mattine", posizione: 2 },
      { parola: "notizia", posizione: 2 },
      { parola: "civetta", posizione: 3 },
      { parola: "patata", posizione: 3 },
      { parola: "forchetta", posizione: 3 },
      { parola: "coperta", posizione: 3 },
      { parola: "cascata", posizione: 3 },
      { parola: "giornata", posizione: 3 },
      { parola: "cravatta", posizione: 3 },
    ],
  },
  {
    parola: "cucina",
    sillabe: "cu-ci-na",
    parole: [
      { parola: "cugino", posizione: 1 },
      { parola: "cugini", posizione: 1 },
      { parola: "cugine", posizione: 1 },
      { parola: "cuscino", posizione: 1 },
      { parola: "cuscini", posizione: 1 },
      { parola: "curioso", posizione: 1 },
      { parola: "cupola", posizione: 1 },
      { parola: "triciclo", posizione: 2 },
      { parola: "tricicli", posizione: 2 },
      { parola: "vicino", posizione: 2 },
      { parola: "bacino", posizione: 2 },
      { parola: "pulcino", posizione: 2 },
      { parola: "preciso", posizione: 2 },
      { parola: "deciso", posizione: 2 },
      { parola: "bambina", posizione: 3 },
      { parola: "gallina", posizione: 3 },
      { parola: "balena", posizione: 3 },
      { parola: "banana", posizione: 3 },
      { parola: "poltrona", posizione: 3 },
      { parola: "regina", posizione: 3 },
      { parola: "corona", posizione: 3 },
    ],
  },
  {
    parola: "panino",
    sillabe: "pa-ni-no",
    parole: [
      { parola: "patata", posizione: 1 },
      { parola: "patate", posizione: 1 },
      { parola: "palazzo", posizione: 1 },
      { parola: "palazzi", posizione: 1 },
      { parola: "palestra", posizione: 1 },
      { parola: "palestre", posizione: 1 },
      { parola: "parente", posizione: 1 },
      { parola: "coniglio", posizione: 2 },
      { parola: "conigli", posizione: 2 },
      { parola: "manina", posizione: 2 },
      { parola: "vernice", posizione: 2 },
      { parola: "canile", posizione: 2 },
      { parola: "granita", posizione: 2 },
      { parola: "fienile", posizione: 2 },
      { parola: "bambino", posizione: 3 },
      { parola: "delfino", posizione: 3 },
      { parola: "tacchino", posizione: 3 },
      { parola: "cuscino", posizione: 3 },
      { parola: "calzino", posizione: 3 },
      { parola: "giardino", posizione: 3 },
      { parola: "vulcano", posizione: 3 },
    ],
  },
];
