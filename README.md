# 📖⏱️ Leggo a Tempo

App web **gratuita**, senza database e senza backend, che ospiterà una
serie di piccoli giochi per allenare la lettura dei bambini. Nessun
account, nessun server: i record vengono salvati nel browser del
dispositivo (`localStorage`).

## 🎮 Gioco 1: "Leggi bisillabe piane semplici"

1. Si entra nel gioco: parte subito un cronometro e vengono mostrate 10
   parole scelte a caso da un elenco di 1000 bisillabe piane (es. "baba").
   Ogni parola è mostrata in grande, con la sua struttura sillabica
   (es. "ba-ba") più piccola sotto.
2. Il bambino legge le 10 parole ad alta voce; quando ha finito preme
   **FINE**, che ferma il cronometro.
3. Durante la lettura può anche mettere in **pausa** il cronometro e farlo
   ripartire (es. se viene interrotto), oppure **ricominciare** da capo
   con le stesse 10 parole per provare a migliorare il tempo.
4. Alla fine può salvare il record scrivendo il proprio nome (il sistema
   ricorda i nomi già usati su quel dispositivo e li ripropone come scelte
   rapide). Il record per ogni bambino è il suo tempo migliore su quel
   gioco: viene aggiornato solo se il nuovo tentativo è più veloce.
5. Dalla home, sotto ogni gioco attivo, si vede la classifica dei record
   salvati su quel dispositivo (dal più veloce).

Altri giochi compariranno in home come schede "Prossimamente" (disattive)
finché non verranno definiti e attivati.

## 🗂️ Struttura del progetto

```
index.html                       pagina principale (home, gioco, risultati)
css/style.css                    stile grafico, responsive, pensato per tablet
js/games.js                      elenco dei giochi disponibili (attivi/non attivi)
js/games/bisillabe-piane-semplici.js   le 1000 parole del primo gioco
js/app.js                        logica: cronometro, griglia parole, record
manifest.json                    per "Aggiungi a Home" su tablet/telefono
icon.svg                         icona dell'app
```

Nessun build step: file statici, pubblicati gratis con **GitHub Pages**.

## ➕ Aggiungere un nuovo gioco

1. Creare `js/games/<id-gioco>.js` con l'elenco di parole (stesso formato
   di `bisillabe-piane-semplici.js`: `{ parola, sillabe }`).
2. Aggiungere il tag `<script src="js/games/<id-gioco>.js">` in
   `index.html`, prima di `js/app.js`.
3. Aggiungere una voce in `js/games.js` con `attivo: true`.
4. Collegare l'id del gioco al suo elenco parole in `GAME_DATA` dentro
   `js/app.js`.

Se il nuovo gioco ha una meccanica diversa (non "leggi 10 parole a
tempo"), la logica in `js/app.js` andrà adattata di conseguenza — non è
pensata per essere generica finché non sappiamo come sarà il secondo
gioco.

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
