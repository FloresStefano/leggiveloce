# 📖⏱️ Leggo a Tempo

App web **gratuita**, senza database e senza backend, che ospiterà una
serie di piccoli giochi per allenare la lettura dei bambini. Nessun
account, nessun server: i record vengono salvati nel browser del
dispositivo (`localStorage`).

## 🎮 Gioco 1: "Bisillabe"

1. Si entra nel gioco: le 10 parole (scelte a caso da un elenco di parole
   reali bisillabe piane, singolare e plurale, es. "casa"/"case") sono
   subito visibili ma **sfocate**, mentre parte un conto alla rovescia
   "3, 2, 1, VIA!". Alla fine del conto alla rovescia le parole diventano
   nitide e parte il cronometro. Ogni parola è mostrata in grande, con la
   sua struttura sillabica (es. "ca-sa") più piccola sotto.
2. Il bambino legge le 10 parole ad alta voce; quando ha finito preme
   **FINE**, che ferma il cronometro e porta alla schermata dei
   risultati.
3. Durante la lettura può anche: mettere in **pausa** il cronometro e
   farlo ripartire; **ricominciare** da capo con le stesse 10 parole
   (rifacendo anche il conto alla rovescia e la sfocatura); oppure
   partire con una **nuova sfida** (10 parole nuove, sempre con conto
   alla rovescia).
4. Nella schermata risultati può **salvare il record** scrivendo il
   proprio nome, oppure scegliere esplicitamente di **non salvarlo**. Il
   sistema ricorda i nomi già usati su quel dispositivo e li ripropone
   come scelte rapide. Il record per ogni bambino è il suo tempo migliore
   su quel gioco: viene aggiornato solo se il nuovo tentativo è più
   veloce.

## 🧩 Gioco 2: "Combina bisillabe"

1. Si entra nel gioco: parte subito il cronometro (nessun conto alla
   rovescia qui). Vengono mostrate due colonne con le stesse 8 parole
   del set estratto, spezzate a metà: a sinistra le prime metà, a destra
   le seconde metà, ciascuna colonna mescolata in modo indipendente.
2. Il bambino tocca una metà a sinistra e una a destra per formare una
   parola. Se la coppia è corretta resta segnata come trovata (verde); se
   è sbagliata viene mostrato un errore (rosso, si può riprovare subito).
3. Il cronometro si ferma da solo quando tutte le 8 coppie sono state
   trovate: l'obiettivo è trovarle tutte nel minor tempo possibile, poi
   si passa automaticamente alla schermata risultati.
4. Come nel Gioco 1: si può salvare (o non salvare) il record, oppure
   ricominciare con le stesse coppie (posizioni rimescolate) o con una
   nuova sfida di 8 parole diverse.

I giochi 1 e 2 condividono lo stesso elenco di parole
(`js/games/bisillabe-piane-semplici.js`) e la stessa classifica per-gioco
(visibile in home, sotto ogni gioco attivo, con il tempo migliore di ogni
bambino).

## 📚 Gioco 3: "Trisillabe"

Stessa identica meccanica del Gioco 1 ("Bisillabe"):
sfocatura + conto alla rovescia "3, 2, 1, VIA!", cronometro, pausa/riprendi,
ricomincia, nuova sfida, FINE con scelta di salvare o non salvare il
record. L'unica differenza è la lista di parole: invece di bisillabe usa
un elenco di ~190 parole italiane semplici di **tre sillabe**, tutte con
accento piano (sulla penultima sillaba, es. "ca-VAL-lo"), scelte e
sillabate a mano da Claude — non caricate dall'utente, ma pensate per
essere parole comuni e di senso compiuto, note a un bambino delle
elementari (animali, famiglia, oggetti di uso quotidiano, ecc.), con
singolare e plurale dove possibile. La lista si trova in
`js/games/trisillabe-piane.js` ed è collegata al gioco tramite
`GAME_DATA` in `js/app.js`, senza bisogno di nuova logica (il `tipo` è
`"lettura"`, lo stesso del Gioco 1).

## 📝 Gioco 4: "Leggi una frase"

Stessa identica meccanica del Gioco 1 e del Gioco 3 (sfocatura + conto
alla rovescia, cronometro, pausa/riprendi, ricomincia, nuova sfida, FINE
con salva/non salvare record) ma invece di 10 parole casuali mostra
**un'unica frase completa**, scelta a caso da un elenco di frasi pronte,
scomposta negli stessi "blocchetti" (parola in grande + sillabe in
piccolo) usati dagli altri giochi di lettura, nello stesso ordine in cui
vanno lette (l'ordine non viene mai rimescolato). Ogni frase ha tra 6 e
15 parole ed è pensata per avere senso compiuto, usando soprattutto le
stesse bisillabe/trisillabe già note al bambino più semplici verbi
elementari e congiunzioni.

Per aiutare il bambino a riconoscere le diverse parti della frase, i
**verbi** hanno un colore diverso (viola, invece del solito colore del
testo). Tutti i blocchetti, comprese le congiunzioni (es. "e", "ma",
"mentre"), mostrano sempre il suggerimento sillabico sotto la parola.
**Ricomincia** rilegge la stessa frase da capo, **nuova sfida** ne
sceglie una diversa a caso dall'elenco (150 frasi): il sorteggio è casuale ma
il gioco ricorda le ultime 20 frasi giocate su quel dispositivo (anche dopo
aver chiuso e riaperto l'app, in `localStorage`) e non le ripropone prima che
siano passate 20 giocate diverse. Le frasi si trovano in
`js/games/frasi.js`; per aggiungerne altre basta aggiungere un nuovo
elenco di blocchetti seguendo lo stesso formato.

**Scelta fatta in autonomia, da confermare o correggere:** la prima
parola di ogni frase è maiuscola e l'ultima ha il punto finale (come in
una frase scritta), a differenza degli altri giochi dove le parole sono
sempre minuscole e senza punteggiatura.

## 🍕 Gioco 5: "Parola a fette"

1. Si entra nel gioco: come sempre, parte un conto alla rovescia "3, 2,
   1, VIA!" con tutto sfocato. Alla fine compare in alto una parola
   trisillaba (es. "matita"), con la sua struttura sillabica sotto, come
   nelle altre letture.
2. Poco sotto ci sono 3 blocchetti piccoli e compatti con le 3 sillabe
   della parola (es. "ma", "ti", "ta"). Il bambino ne sceglie una: quella
   è la sillaba su cui giocherà per tutta la partita (non si può più
   cambiare, per non confondersi a metà).
3. Più sotto ci sono 15 parole trisillabe, anche loro piccole e compatte
   e senza suggerimento sillabico: 5 condividono la prima sillaba della
   parola target, 5 la seconda, 5 la terza. Il bambino deve leggere e
   trovare le 5 che condividono proprio la sillaba scelta al punto 2, nel
   minor tempo possibile.
4. Se sbaglia, il blocchetto diventa rosso; ci si clicca sopra di nuovo
   per "correggersi" e farlo tornare normale, e si può riprovare. Se la
   scelta è giusta il blocchetto diventa verde e resta bloccato. Trovate
   tutte e 5, il cronometro si ferma da solo e si passa alla schermata
   risultati (salva/non salvare il record, come sempre).

Le 3 parole target attuali (matita, cucina, panino) e le loro parole
associate si trovano in `js/games/parola-a-fette.js`, scelte, sillabate
e verificate (con uno script) in modo che ogni parola condivida *una
sola* sillaba con la parola target, mai due, per evitare ambiguità. Il
file dati ha 7 parole "pulite" verificate per ciascuna delle 3 posizioni
(21 in tutto per parola target), ma ad ogni partita (e ad ogni "Nuova
sfida") ne vengono mostrate solo 5 a caso per posizione — 15 in tutto —
così l'obiettivo è uniforme con il Gioco 6 e ogni tentativo può proporre
una combinazione leggermente diversa. Trovare parole "pulite" per
ognuna delle 3 posizioni di una parola richiede molta più cura che
riempire un semplice elenco, per questo si parte con solo 3 parole
target: aggiungerne altre in futuro è possibile seguendo lo stesso
schema (e lo stesso script di verifica).

**Scelte fatte in autonomia, da confermare o correggere:** non ho
aggiunto il tasto Pausa a questo gioco (come "Combina bisillabe", che è
strutturalmente simile essendo anch'esso un gioco di ricerca a tempo, non
di lettura ad alta voce con FINE manuale); la scelta della sillaba, una
volta fatta, resta fissa per tutta la partita.

## 🔁 Gioco 6: "Lettere speculari" (b/d/p/q)

1. Si entra nel gioco: come sempre, parte un conto alla rovescia "3, 2, 1,
   VIA!" con tutto sfocato. Alla fine compaiono in alto 4 blocchetti
   piccoli e compatti, uno per ciascuna lettera speculare: **b**, **d**,
   **p**, **q**.
2. Il bambino ne sceglie una: quella è la lettera su cui giocherà per
   tutta la partita (non si può più cambiare, come la sillaba in "Parola a
   fette").
3. Più sotto ci sono 20 parole (bisillabe o trisillabe), anche loro
   piccole e compatte e senza suggerimento sillabico: 5 parole per ognuna
   delle 4 lettere. Ogni parola contiene *una sola* delle 4 lettere
   speculari (mai due insieme, per non creare ambiguità), come iniziale o
   all'interno della parola. Il bambino deve leggere e trovare le 5 parole
   che contengono proprio la lettera scelta, nel minor tempo possibile.
4. Se sbaglia, il blocchetto diventa rosso; ci si clicca sopra di nuovo
   per "correggersi" e farlo tornare normale, e si può riprovare. Se la
   scelta è giusta il blocchetto diventa verde e resta bloccato. Trovate
   tutte e 5, il cronometro si ferma da solo e si passa alla schermata
   risultati (salva/non salvare il record, come sempre).

Le parole si trovano in `js/games/lettere-speculari.js`, raggruppate per
lettera (8-11 parole disponibili per lettera, verificate una per una in
modo che ognuna contenga solo quella lettera speculare): ad ogni partita
(e ad ogni "Nuova sfida") ne vengono pescate 5 a caso per lettera, per un
totale di 20 parole diverse ogni volta. (Il gioco era partito con 6
parole/lettera da trovare; l'obiettivo è stato uniformato a 5, come nel
Gioco 5, su richiesta esplicita.)

**Scelte fatte in autonomia, da confermare o correggere:**
- le 4 lettere sono sempre mostrate nello stesso ordine fisso b-d-p-q (non
  mescolate), per dare al bambino un riferimento visivo costante mentre
  si allena a distinguerle.
- ho scritto le lettere con un font sans-serif semplice (lo stesso del
  testo, non quello arrotondato dei titoli/parole) e più grande del
  solito, per rendere ben leggibile la forma di ciascuna lettera.
- come "Parola a fette" e "Combina bisillabe", non ho aggiunto il tasto
  Pausa (gioco di ricerca a tempo, non di lettura ad alta voce con FINE
  manuale); la scelta della lettera, una volta fatta, resta fissa per
  tutta la partita.

## 🧮 Gioco 7: "Somme col riporto"

Come sempre parte con il conto alla rovescia "3, 2, 1, VIA!" (tutto sfocato)
e poi il cronometro. Il bambino vede una somma con riporto (due numeri da 1 a
9, risultato da 11 a 18; primo numero corallo, secondo azzurro) e due
bastoncini a quadretti della stessa lunghezza dei numeri.

1. **Scatola da 10**: cornice larga esattamente 10 quadretti (numeri 1-10
   sotto). I bastoncini si dispongono uno dopo l'altro da sinistra; se
   superano il 10, la parte in più esce dalla cornice e compare "esce
   fuori! ✂️". Il contatore in alto a destra mostra "N / 10" (verde se è 10,
   rosso se è di più).
2. **Spezzare**: si tocca/clicca la linea tra due quadretti di un
   bastoncino (con il mouse la linea diventa scura al passaggio). I due
   pezzi mantengono il colore.
3. **Spostare**: i pezzi si muovono tra le tre zone (Bastoncini, Scatola da
   10, Scatola del riporto, larga 8 quadretti) trascinandoli, oppure
   toccando il pezzo (si solleva) e poi la zona.
4. **Aiuti a parole** (compaiono premendo CONTROLLA): "Il bastoncino esce
   dalla scatola: spezzalo dove finisce il 10!", "Scatola piena! Ora sposta
   l'avanzo nella scatola del riporto.", "La scatola deve contenere
   esattamente 10 quadretti.".
5. Quando la scatola ha esattamente 10 quadretti e non resta nulla fuori
   (quindi il riporto è giusto) il gioco **non finisce**: compare "Quanto fa
   7 + 5?" con 6 risposte (quella giusta + 5 sbagliate vicine, tra 10 e 19,
   in ordine casuale). Risposta sbagliata: il pulsante diventa grigio e
   compare "No, riprova! Conta 10 nella scatola più il riporto.". Risposta
   giusta: il cronometro si ferma, il pulsante diventa verde, la domanda
   diventa "Bravo! 7 + 5 = 12 · 8.4s" e il "?" diventa il risultato.
6. **Ricomincia** riparte con gli stessi numeri (rifacendo il conto alla
   rovescia), **Nuova sfida** genera numeri nuovi (mai la stessa somma di
   quella appena fatta) e azzera il tempo.

Opzioni sotto il gioco: **🔢 Mostra i numeri** (numeri 1-10 / 1-8 sotto le
scatole, acceso di default) e **💡 Aiuto** (spento di default: evidenzia con
una linea tratteggiata lampeggiante il punto dove spezzare il bastoncino per
arrivare a 10).

Non usa nessun file di parole: i numeri sono generati dal codice
(`js/app.js`, sezione "GIOCO 7").

**Scelte fatte in autonomia, da confermare o correggere:**
- ho aggiunto il tasto **🏠 Esci** (come in tutti gli altri giochi), non
  presente nell'elenco dei pulsanti della richiesta.
- a risposta giusta non compare nessuna finestra, come richiesto; per
  salvare il record nella classifica (come negli altri giochi) il tasto
  CONTROLLA diventa **💾 Salva il tempo**, che porta alla solita schermata
  "Tempo finale" (salva / non salvare).
- la scheda con le 6 risposte compare tra la prima e la seconda riga (come
  negli screenshot), non in fondo; appare da sola quando la scatola è
  giusta, e sparisce se il bambino rimette in disordine i pezzi.
- i messaggi di aiuto compaiono solo premendo CONTROLLA; per il caso non
  previsto (scatola ancora da riempire e bastoncini ancora fuori) il testo
  è "Sposta i bastoncini nella scatola da 10 per riempirla.".
- toccando una linea di taglio senza trascinare il pezzo si spezza;
  trascinando da lì si sposta tutto il pezzo. Se un pezzo è già sollevato e
  si tocca un pezzo di un'altra zona, vale come toccare quella zona. I pezzi
  spostati si accodano alla fine della zona (non si riordinano).
- su schermi stretti i quadretti si rimpiccioliscono sotto i 44px (e sotto i
  900px di larghezza le zone si dispongono in colonna) per far stare tutto.
- le opzioni (numeri, aiuto) restano in memoria solo finché l'app è aperta.

Altri giochi compariranno in home come schede "Prossimamente" (disattive)
finché non verranno definiti e attivati.

## 🗂️ Struttura del progetto

```
index.html                             home, giochi 1-7, risultati
css/style.css                          stile grafico, responsive, per tablet
js/games.js                            elenco dei giochi (id, tipo, attivo/non attivo)
js/games/bisillabe-piane-semplici.js   le parole usate dai giochi 1 e 2
js/games/trisillabe-piane.js           le parole usate dal gioco 3
js/games/frasi.js                      le frasi usate dal gioco 4
js/games/parola-a-fette.js             le parole target + parole associate usate dal gioco 5
js/games/lettere-speculari.js          le parole (per lettera b/d/p/q) usate dal gioco 6
js/app.js                              logica: cronometro, tutte le meccaniche, record
manifest.json                          per "Aggiungi a Home" su tablet/telefono
icon.svg                               icona dell'app
```

Nessun build step: file statici, pubblicati gratis con **GitHub Pages**.

## ➕ Aggiungere un nuovo gioco

1. Se serve un nuovo elenco di parole (o frasi), creare
   `js/games/<id-gioco>.js` (stesso formato di
   `bisillabe-piane-semplici.js`: `{ parola, sillabe }`, oppure di
   `frasi.js` per una lista di frasi, oppure di `parola-a-fette.js` per
   parole target + parole associate) e aggiungere
   `<script src="js/games/<id-gioco>.js">` in `index.html` prima di
   `js/app.js`.
2. Aggiungere una voce in `js/games.js` con `attivo: true` e un `tipo`
   (`"lettura"`, `"abbinamento"`, `"frase"`, `"fette"`, `"lettere"`, `"riporto"`, o uno
   nuovo se la meccanica è diversa).
3. Collegare l'id del gioco al suo elenco parole/frasi in `GAME_DATA`
   dentro `js/app.js`.
4. Se il `tipo` è nuovo (non uno di quelli già gestiti), va scritta la
   logica corrispondente in `js/app.js` (una nuova schermata in
   `index.html` + le funzioni avvia/ricomincia/nuova sfida per quel
   gioco) — `js/app.js` non è generico oltre le meccaniche già presenti.

## 🖥️ Provarla in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

(oppure basta aprire `index.html` con doppio click)

## 🚀 Pubblicazione (GitHub Pages)

Pubblicato gratuitamente da GitHub Pages, branch `main`, cartella
principale — nessuna build. Ogni `git push` su `main` aggiorna il sito
online in pochi minuti.

## 📄 Licenza

MIT — vedi `LICENSE`.
