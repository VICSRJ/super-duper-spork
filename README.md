# Botanic Warehouse

Lehká skladová webová aplikace pro GitHub Pages. Primární jednotkou je pytel, množství je vedeno v gramech.

## Aktuální funkce

- dashboard se zásobou, aktivními pytli a pohyby
- příjem nového pytle s automatickým ID
- výdej se selekcí FEFO + FIFO a kontrolou dostupného množství
- přesun pytle mezi boxy a skladovými pozicemi
- katalog surovin a minimální zásoby
- mapa skladu A1–D10
- append-only historie skladových pohybů
- **fyzická inventura** s rozpracovaným stavem, skutečným množstvím a rozdílem proti systému
- XLSX import/export pro `suroviny`, `pytle`, `box`, `pozice`, `pohyby`
- kontrola datových invariantů před uložením
- lokální outbox připravený pro budoucí synchronizaci
- Dark / Light režim
- responzivní desktop + telefonní rozhraní
- PWA shell / offline použití lokálních dat
- klávesové zkratky `Ctrl/Cmd+K` a `Ctrl/Cmd+N`

## Datová pravidla

- množství je vždy v gramech a nikdy nesmí být záporné
- `qty` nesmí překročit `initialQty`
- každý pytel musí odkazovat na existující surovinu, box a pozici
- ID pytlů a pohybů se generují deterministicky z interních čítačů
- pohybový ledger se nepřepisuje jako běžný záznam skladu
- fyzická inventura pouze porovnává skutečnost se systémem; sama automaticky nepřepisuje zásobu

## Architektura

Aktuální verze je statická PWA a běží bez backendu. Data jsou lokálně v prohlížeči. Pro více uživatelů a současné operace je cílová architektura REST API + PostgreSQL/Supabase s transakčním zámkem při výdeji.

## GitHub Pages

Aplikace je připravena k publikaci z větve `main` a kořene `/` přes GitHub Pages.
