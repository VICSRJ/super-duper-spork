# Botanic WMS

Lehká, responzivní skladová PWA pro evidenci surovin v pytlích. Primární skladová jednotka je **pytel** a všechna množství jsou vedena v **gramech**.

## Co je implementováno

- dashboard a okamžitý přehled zásoby
- skladové pytle, šarže, expirace, boxy a pozice
- FEFO + FIFO pořadí pro výdej
- příjem s automatickým ID pytle
- validace množství, referencí a obsazení pozic
- výdej a automatické převedení balení na `Otevřený`
- přesuny mezi boxy/pozicemi
- mapa skladu `A1–D10`
- append-only ledger pohybů
- stav `OK / NÍZKÁ / BRZY EXPIRUJE / EXPIRACE / VYČERPÁNO`
- katalog surovin a minimální zásoby
- XLSX import kompatibilní s původním Botanic sešitem
- XLSX export včetně `SKLAD` a `POHYBY_LOG`
- lokální perzistence a offline outbox připravený pro synchronizaci
- PWA manifest + service worker
- mobilní i desktopové rozhraní

## Zdroj dat

Aplikace respektuje původní strukturu Botanic sešitu: `nob`, `suroviny`, `pytle`, `box`, `pozice`. Import je navržen tak, aby starší katalog šel načíst bez ručního přepisování.

## Důležitá hranice této verze

Tato verze je **single-device/static PWA** pro GitHub Pages. Zdroj pravdy je lokální prohlížeč. Offline outbox pouze eviduje změny připravené k budoucí synchronizaci.

Pro skutečný víceuživatelský provoz je nutný serverový backend s PostgreSQL a ACID transakcemi. Kritické operace, zejména souběžný výdej, nesmí být řešeny pouze v klientovi.

Viz `docs/ARCHITECTURE.md` pro invarianty, datový model a cílový serverový tok.

## GitHub Pages

Repozitář obsahuje workflow `.github/workflows/pages.yml`, které publikuje statický obsah přes GitHub Pages.

Po zapnutí **Settings → Pages → Source: GitHub Actions** se nasazení spouští při pushi do `main`.

## Lokální použití

Stačí servírovat kořen repozitáře statickým serverem. Prohlížeč aplikaci otevře bez buildu Node.js.
