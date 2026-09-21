# 📖⏱️ Leggo a Tempo

App web **gratuita**, senza database e senza backend, per allenare la lettura
veloce dei bambini (6-7 anni, primo/secondo anno di elementari). Il bambino
legge gruppi di parole prima che scada il tempo, con una piccola verifica
ogni tanto per controllare che abbia davvero letto.

Pensata per essere usata su **tablet**: pulsanti grandi, testo ampio,
funziona anche offline dopo il primo caricamento e può essere aggiunta alla
schermata home come una vera app.

## 🎮 Come funziona

1. Si sceglie un livello: **Facile**, **Medio** o **Difficile**.
2. A ogni "scheda" appare un gruppo di parole; una barra colorata mostra il
   tempo che resta prima che passi alla scheda successiva.
3. Ogni 4 schede compare una mini-domanda ("Quale parola hai appena letto?")
   per verificare la comprensione.
4. Alla fine si vede un riepilogo: parole lette, velocità (parole al
   minuto) e precisione, con un punteggio a stelle. Il record personale per
   ogni livello viene salvato **sul dispositivo** (nessun account, nessun
   server: usa `localStorage` del browser).

## 🗂️ Struttura del progetto

```
index.html        pagina principale
css/style.css      stile grafico, responsive e pensato per tablet
js/data.js         contenuti dei livelli (le frasi da leggere)
js/app.js          logica del gioco
manifest.json       per "Aggiungi a Home" su tablet/telefono
icon.svg            icona dell'app
```

Nessun build step: sono file statici, funzionano aprendo `index.html` anche
senza server, e si pubblicano gratis con **GitHub Pages**.

## ➕ Aggiungere nuove frasi o livelli

Basta modificare `js/data.js`: ogni livello ha un array `schede` di
stringhe. Aggiungi una riga per aggiungere una nuova frase, nessun altro
file va toccato. Puoi anche creare un livello completamente nuovo copiando
uno dei blocchi esistenti e cambiando `id`, `nome`, `displayMs` (tempo in
millisecondi) e `schede`.

## 🖥️ Provarla in locale

Basta aprire `index.html` con un doppio click, oppure con un piccolo
server locale:

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## 🚀 Pubblicazione (GitHub Pages)

Il sito è pubblicato gratuitamente con GitHub Pages direttamente dal branch
`main`, cartella principale — nessuna build, nessuna Action necessaria.
Ogni `git push` su `main` aggiorna automaticamente il sito online in pochi
secondi/minuti.

## 📄 Licenza

Rilasciato con licenza MIT: puoi modificarlo, ampliarlo e usarlo
liberamente (vedi `LICENSE`).
