# 🎂💀 JASON BIRTHDAY BRAINROT — Der Plan 💀🎂

> "Chat, ist das echt? Jason wird wirklich ein Jahr älter? Aura -10.000." 

Ziel: Eine Geburtstagswebsite für Jason, die so degeneriert, überladen und gestört ist,
dass man sie nicht mehr schließen kann. Feinster Brainrot, aber mit Herz.
Dazu ein kleines Spiel.

---

## 1. Tech-Stack (bewusst simpel)

- **Reines HTML + CSS + Vanilla JS**, kein Build-Schritt, kein Framework.
- **Hosting: GitHub Pages** direkt aus dem Repo → Link einfach verschicken.
- **Sounds per Web Audio API + `speechSynthesis`** (Browser-Text-to-Speech liest
  absurde Sätze vor) → keine urheberrechtlich geschützten Audiodateien nötig.
- Bilder: Emojis, CSS-Effekte und (optional) Fotos von Jason, die wir selbst reinlegen.

```
/
├── index.html        # Startseite + Eingangs-Gate
├── style.css         # Chaos-CSS
├── chaos.js          # Effekte, Sounds, Popups, Easter Eggs
├── game.js           # Das Minispiel
├── assets/           # Fotos von Jason (Kopf ausgeschnitten = Pflicht), Favicon
└── PLAN.md
```

---

## 2. Aufbau der Seite

### 2.1 Eingangs-Gate (nötig wegen Autoplay-Sperre der Browser)
- Vollbild-Button: **„KLICK HIER FÜR GRATIS AURA (100% KEIN VIRUS)“**
- Erst nach dem Klick dürfen Sound & Chaos starten.
- Fake-Ladebalken: „Lade Rizz… 69% … 67% … 420% … Ohio-Server erreicht“.

### 2.2 Hero-Bereich
- Riesiger Text **„HAPPY BIRTHDAY JASON“** in Comic Sans / Impact, Regenbogen-Animation,
  wackelnd, mit Glitch-Effekt.
- Jasons Gesicht dreht sich als Kopf auf einem Skibidi-Klo / Haikörper mit Nike-Schuhen
  (Tralalero-Tralala-Style) – falls Fotos vorhanden, sonst Emoji-Kopf 🗿.
- Ticker-Laufband unten: „BREAKING: Jason offiziell Sigma ++ Lebenserwartung -1 Jahr ++
  Fanum Tax auf den Kuchen erhoben ++ 6 7 6 7 6 7 ++“.

### 2.3 „Aura-Zähler“
- Ein Counter, der Jasons Aura anzeigt und zufällig hoch- und runterspringt
  („+1000 Aura: hat Geburtstag“, „-500 Aura: ist jetzt alt“).

### 2.4 „Italian Brainrot Gratulations-Wand“
- Karten mit erfundenen Brainrot-Charakteren, die Jason gratulieren, z. B.
  - **Jasonini Tortellini** – „Auguri, fratello del rizz“
  - **Tung Tung Tung Torte** – haut mit dem Kuchen auf den Tisch
  - **Bombardiro Geburtstagodilo** – wirft Kerzen ab
  - **Ballerina Kuchenccina**
- Klick auf eine Karte → Browser-TTS liest den Spruch mit absurder Stimme/Tonhöhe vor.

### 2.5 Split-Screen-Modus („Aufmerksamkeitsspanne-Rettung“)
- Ein Button aktiviert einen Fake-Subway-Surfers-/Seifenschneide-Split-Screen
  (CSS-Animation, kein echtes Video), während daneben ein todernster
  Geburtstagsbrief steht.

### 2.6 Chaos-Effekte (wiederverwendbar, global)
- Cursor zieht eine Spur aus 💀🔥🎂🗿.
- Zufällige Fake-Windows-Popups: „Ihr PC hat 1 Gyatt gefunden. Entfernen? [JA] [AUF JEDEN]“.
- Gelegentlich Screen-Shake, Farb-Invertierung, Vine-Boom-artiger Bass (Web Audio).
- Der „Schließen“-Button bei Popups flüchtet vor der Maus.
- Konami-Code / Tippen von „sigma“ → Easter Egg (z. B. ganze Seite wird zu Ohio-Modus).
- Tab-Titel wechselt, wenn man den Tab verlässt: „KOMM ZURÜCK JASON 😭“.

### 2.7 Ernst-Moment (ganz unten, versteckt)
- Nach dem ganzen Wahnsinn: ein kurzer, ehrlich gemeinter Glückwunsch,
  ruhiger Hintergrund – bevor alles wieder explodiert. (Kontrast = Comedy.)

---

## 3. Das Spiel: **„FANUM TAX: Rette den Kuchen“** 🎂

Kleines Canvas-Spiel, in 30–60 Sekunden durchgespielt, mobilfreundlich.

**Idee:** Jason (Kopf mit 🗿-Körper) steht unten und bewegt sich nach links/rechts
(Maus, Pfeiltasten oder Touch). Von oben fallen Dinge:

| Fällt runter | Effekt |
|---|---|
| 🎂 Kuchenstück | +67 Aura |
| 🎁 Geschenk | +100 Aura |
| 🕯️ Kerze | +1 Lebensjahr (Punkte ×1,5, Tempo steigt) |
| 🚽 Skibidi-Klo | –1 Leben |
| 🧌 Fanum | klaut dir alle Kuchen der letzten 5 Sekunden („FANUM TAX!“) |
| 📉 „L“ | Bildschirm wird kurz grau, Musik verzerrt |

- 3 Leben, Tempo steigt stetig.
- Game Over Screen mit Rang je nach Punktzahl:
  - < 500: **„Ohio-Bewohner“**
  - < 1500: **„NPC mit Potenzial“**
  - < 3000: **„Rizzler“**
  - ≥ 3000: **„SKIBIDI SIGMA GEBURTSTAGSKÖNIG“** + Konfetti-Explosion + TTS-Ansage
- Highscore im `localStorage` („Dein Rekord, Bruder“).
- Optional später: gemeinsame Highscore-Liste für alle Gäste.

**Alternative (falls lieber):** „Flappy Jason“ – Jasons Kopf fliegt durch Kerzen-Röhren.

---

## 4. Umsetzungsschritte

1. **Grundgerüst**: `index.html`, `style.css`, `chaos.js`, Eingangs-Gate, GitHub-Pages-fähig.
2. **Hero + Ticker + Aura-Zähler** inkl. Glitch-/Regenbogen-CSS.
3. **Chaos-Engine**: Cursor-Spur, Popups, Screen-Shake, Sound-Effekte (Web Audio), TTS.
4. **Brainrot-Wand** mit Charakterkarten und TTS-Sprüchen.
5. **Spiel** (`game.js`) inkl. Steuerung für Maus/Tastatur/Touch, Ränge, Highscore.
6. **Split-Screen-Modus + Easter Eggs + Ernst-Moment.**
7. **Feinschliff**: Handy testen, Performance (Effekte drosseln auf schwachen Geräten),
   „Reduzierte Bewegung“-Schalter für Leute, die sonst einen Anfall kriegen.
8. **Deploy** auf GitHub Pages, Link an alle.

---

## 5. Entscheidungen

- Keine persönlichen Daten (kein Alter, kein Datum, keine Fotos) → 🗿 als Jason.
- Deutsch mit Brainrot-Anglizismen.
- Spiel: „Fanum Tax: Rette den Kuchen“.
- Volle Lautstärke und Blinken erlaubt (Anfall-Schutz-Button 😵‍💫 trotzdem vorhanden).
