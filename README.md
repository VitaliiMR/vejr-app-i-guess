# Vejr

En responsiv vejrapp i vanilla JavaScript med ES modules. Den viser vejret for brugerens placering, en femdagesprognose og timedetaljer for hver dag. Byer kan også findes via søgefeltet.

## Kom i gang

Servér projektmappen fra en lokal webserver, og åbn dens adresse i browseren. For eksempel:

```powershell
python -m http.server 8000
```

Åbn derefter `http://localhost:8000`. En webserver er nødvendig for ES modules, service worker og browserens placeringstilladelse. Appen bruger Open-Meteos gratis Forecast- og Geocoding-API'er uden API-nøgle.

## Struktur

- `Assets/JS/site.js` — controller og eventhåndtering.
- `Assets/JS/openMeteo.js` — model/API-adgang.
- `Assets/JS/weatherView.js` — visning og vejrkomponenter.
- `Assets/CSS/site.css` — responsiv styling.
- `service-worker.js` — offline-cache.

## Cachestrategi

- Open-Meteo Forecast- og Geocoding-kald bruger **network first, fallback to cache**. Nye vellykkede svar gemmes; netværksfejl og fejlsvar bruger et tidligere gemt svar, hvis det findes.
- Appens HTML, CSS og JavaScript bruger **cache first, fallback to network**. Nye vellykkede statiske svar gemmes til senere offline-brug.

## Vejrdata

Aktuelle temperaturer, føles-som-temperatur, vejrkode, vind i 10 meters højde, vindretning og nedbør vises sammen med fem dages maks./min.-temperaturer, vind og nedbør fordelt på regn, byger og sne. Vælg en dag for at se timedata.
