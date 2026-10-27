# Pizzapolisen – webbplats

Responsiv svensk webbplats med polissnack/komedi, recensioner, topplista och intern adminvy.

## Viktigt innan publicering
Detta är en färdig front-end/startmall, men den är **inte publicerad** och inloggningen fungerar inte förrän Supabase har konfigurerats. Ingen riktig recension, poäng eller pizzeria har hittats på eller lagts in. För närvarande finns inga verkliga recensioner i innehållet.

## Funktioner
- Startsida och humoristisk visuell profil
- Recensionskort och topplista som fylls från databasen
- Adminvy för inloggning, publicering, redigering och radering
- Grund för tipsformulär (inte inkopplat till mottagare ännu)
- SQL-schema och Row Level Security för recensioner

## Driftsätt admin/inloggning
1. Skapa ett projekt hos Supabase.
2. I Supabase Project Settings → API, kopiera Project URL och anon/public key till `config.js`.
3. Öppna SQL Editor i Supabase och kör hela `supabase-setup.sql`.
4. Under Authentication: stäng av publik registrering och bjud in/skapa konton för grabbarna. Testa att endast inloggade användare kan skriva.
5. Under Authentication → URL Configuration, lägg till den slutliga webbplatsdomänen som Site URL och Redirect URL.
6. `index.html` och `admin.html` läser båda `config.js`. Lägg in samma Project URL och anon/public key där. Skrivåtkomst styrs av databasens RLS.
7. Publicera filerna på en statisk webbhost, exempelvis Netlify. Koppla domänen efter att domänen köpts.
8. Testa publicering, redigering, radering, mobilvy och utloggning innan ni annonserar sidan.

## Bilder
Fältet `Bild-URL` kan användas för en bild som redan ligger på en publik, stabil URL. För riktig bilduppladdning rekommenderas Supabase Storage med en separat bucket och accessregler. Lägg inte upp bilder utan att ha rätt att publicera dem.

## Tipsformulär
På startsidan visas en tydlig notering om att tipsfunktionen inte är inkopplad. Innan den aktiveras behövs en mottagare och helst en serverfunktion eller formulärtjänst som tar emot tips säkert.

## Domän
Domän är inte köpt eller ansluten i detta paket. Kontrollera tillgänglighet hos en registrar innan köp.
