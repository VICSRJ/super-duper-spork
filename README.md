# Botanic Warehouse

Lehká skladová webová aplikace pro GitHub Pages. Primární jednotkou je pytel, množství je vedeno v gramech.

## Funkce

- dashboard se zásobou, aktivními pytli a pohyby
- FIFO výdej podle data příjmu
- příjem nového pytle s automatickým ID
- výdej a přesun pytle mezi pozicemi
- katalog surovin a minimální zásoba
- mapa skladu A1–D10
- append-only historie pohybů
- XLSX import/export kompatibilní se strukturou `suroviny`, `pytle`, `box`, `pozice`
- lokální ukládání v `localStorage`
- PWA shell
- responzivní desktop + telefonní rozhraní

## Architektura

Aktuální verze je statická a běží bez backendu. Data se ukládají v prohlížeči. Pro více uživatelů je přirozený další krok REST/API + PostgreSQL/Supabase.

## GitHub Pages

V repozitáři je vše připraveno pro publikaci z větve `main` a kořene `/` přes GitHub Pages.
