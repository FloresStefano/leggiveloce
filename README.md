# 📖⏱️ Leggo a Tempo

App web **gratuita**, senza database e senza backend, che ospiterà una
serie di piccoli giochi per allenare la lettura dei bambini. Nessun
account, nessun server: i record vengono salvati nel browser del
dispositivo (`localStorage`).

## 🎮 Gioco 1: "Leggi bisillabe piane semplici"

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
   rovescia qui). Vengono mostrate due colonne con le stesse 10 parole
   del set estratto, spezzate a metà: a sinistra le prime metà, a destra
   le seconde metà, ciascuna colonna mescolata in modo indipendente.
2. Il bambino tocca una metà a sinistra e una a destra per formare una
   parola. Se la coppia è corretta resta segnata come trovata (verde); se
   è sbagliata viene mostrato un errore (rosso, si può riprovare subito).
3. Il cronometro si ferma da solo quando tutte le 10 coppie sono state
   trovate: l'obiettivo è trovarle tutte nel minor tempo possibile, poi
   si passa automaticamente alla schermata risultati.
4. Come nel Gioco 1: si può salvare (o non salvare) il record, oppure
   ricominciare con le stesse coppie (posizioni rimescolate) o con una
   nuova sfida di 10 parole diverse.

Entrambi i giochi condividono lo stesso elenco di parole
(`js/games/bisillabe-piane-semplici.js`) e la stessa classifica per-gioco
(visibile in home, sotto ogni gioco attivo, con il tempo migliore di ogni
bambino).

Altri giochi compariranno in home come schede "Prossimamente" (disattive)
finché non verranno definiti e attivati.

## 🗂️ Struttura del progetto

```
index.html                             home, gioco 1, gioco 2, risultati
css/style.css                          stile grafico, responsive, per tablet
js/games.js                            elenco dei giochi (id, tipo, attivo/non attivo)
js/games/bisillabe-piane-semplici.js   le parole usate da entrambi i giochi
js/app.js                              logica: cronometro, entrambe le meccaniche, record
manifest.json                          per "Aggiungi a Home" su tablet/telefono
icon.svg                               icona dell'app
```

Nessun build step: file statici, pubblicati gratis con **GitHub Pages**.

## ➕ Aggiungere un nuovo gioco

1. Se serve un nuovo elenco di parole, creare `js/games/<id-gioco>.js`
   (stesso formato di `bisillabe-piane-semplici.js`: `{ parola, sillabe }`)
   e aggiungere `<script src="js/games/<id-gioco>.js">` in `index.html`
   prima di `js/app.js`.
2. Aggiungere una voce in `js/games.js` con `attivo: true` e un `tipo`
   (`"lettura"`, `"abbinamento"`, o uno nuovo se la meccanica è diversa).
3. Collegare l'id del gioco al suo elenco parole in `GAME_DATA` dentro
   `js/app.js`.
4. Se il `tipo` è nuovo (non "lettura" né "abbinamento"), va scritta la
   logica corrispondente in `js/app.js` (una nuova schermata in
   `index.html` + le funzioni avvia/ricomincia/nuova sfida per quel
   gioco) — `js/app.js` non è generico oltre le due meccaniche già
   presenti.

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
