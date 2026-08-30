# Botanic WMS — architektura

## Aktuální runtime

Verze v tomto repozitáři je **statická PWA**. Primární úložiště je `localStorage`, synchronizační fronta je oddělená v `botanic-wms-sync-queue-v1` a service worker obsluhuje offline shell.

Toto je záměrné pro GitHub Pages. Nejde o náhradu víceuživatelského serveru: skutečná ACID souběžnost vyžaduje backend + PostgreSQL.

## Doménový model

`Surovina → Pytel → Box + Pozice → Pohyb`

Pytel je primární skladová jednotka a všechna množství jsou v gramech.

### Invarianty

1. `qty >= 0`
2. `qty <= initialQty`
3. každý pytel má unikátní ID
4. pytel odkazuje na existující surovinu, box a pozici
5. aktivní pytel nesmí být současně umístěn do stejného `box + pozice` jako jiný aktivní pytel
6. pohyb je pouze append-only; historie se nemaže při běžné operaci
7. expirace nesmí být před datem příjmu
8. výdej nesmí překročit dostupné množství

## Výdejní strategie

Aplikace řadí kandidáty pro stejnou surovinu podle:

1. nejbližšího data expirace (FEFO)
2. při shodě podle data příjmu (FIFO)
3. při shodě podle ID pytle

Tím je pořadí deterministické a opakovatelné.

## Audit

Každá mutace zapisuje záznam do `movements` s:

- ID pohybu
- timestampem
- typem (`Příjem`, `Výdej`, `Přesun`)
- ID pytle
- množstvím
- zdrojem a cílem
- důvodem
- lokálním operátorem

## Offline

Lokální operace se uloží okamžitě a do samostatné fronty se zapíše synchronizační intent. Po návratu online aplikace frontu oznámí uživateli. V serverové verzi musí být tato fronta odesílána idempotentně a server musí rozhodovat o konfliktech.

## Serverová cílová architektura

Pro víceuživatelský provoz má být zdroj pravdy:

- PostgreSQL
- API s validací vstupu
- transakční výdej se zámkem řádků (`FOR UPDATE`)
- append-only ledger pohybů
- RBAC (admin / skladník)
- idempotency key pro mutační požadavky
- server-side audit timestamp a identity uživatele
- IndexedDB pouze jako klientská cache/offline outbox

Doporučený tok výdeje:

```text
request → auth → validate → BEGIN
       → lock eligible packs
       → reserve/decrement stock
       → append movement
       → COMMIT
       → response
```

## Import XLSX

Import podporuje strukturu původního souboru Botanic, zejména listy:

- `nob` / `suroviny`
- `pytle`
- `box`
- `pozice`

Export navíc vytváří `SKLAD` a `POHYBY_LOG` pro rychlý přehled a audit.
