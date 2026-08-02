# Bildgenerierungs-Prompts für die Kartenmotive (Gemini)

Fünf Motive, eins pro Übung. Damit die Figuren konsistent aussehen: **alle fünf
Bilder in derselben Chat-Session generieren** und ab dem zweiten Bild „the exact
same character as before" referenzieren. Bei Ausreißern einzeln nachgenerieren.

Zielformat: quadratisch (1:1), einfarbiger Cremehintergrund `#faf3e4`, damit die
Bilder freigestellt in die Kartenmitte gesetzt werden können. Kein Text im Bild.

## Basis-Prompt (für das erste Bild, Übung einsetzen)

```text
A vintage storybook illustration of a playing-card soldier from Alice in
Wonderland reimagined as a muscular CrossFit athlete. The character's torso is
a white rectangular playing card with rounded corners showing a single large
red heart symbol in the center. It has short, extremely muscular arms and legs
in black, cartoonish proportions, small round head with a light skin tone and
a red sweatband. Style: hand-drawn pen-and-ink with flat colors, limited
palette of cream (#faf3e4), ink black (#26201c) and playing-card red
(#c22f2f), reminiscent of John Tenniel's Alice in Wonderland engravings but
bold and modern. The character is doing PUSH-UPS: horizontal plank position,
arms bent, body rigid, determined face. Full figure centered, plain flat cream
background (#faf3e4), no text, no border, square 1:1 format.
```

## Varianten für die weiteren vier Bilder

Jeweils den Übungs-Satz ersetzen (und „the exact same character as before"
voranstellen):

**Jumping Jacks** (Karo — Kartensymbol im Prompt zu „red diamond" ändern):
```text
The character is doing JUMPING JACKS: mid-jump, legs spread wide, both arms
raised in a V above the head, joyful energetic expression, small motion lines
around hands and feet.
```

**Crunches** (Pik — „black spade symbol"):
```text
The character is doing CRUNCHES: lying on its back on the ground, knees bent,
upper body curled up towards the knees, arms reaching forward, straining face.
```

**Air Squats** (Kreuz — „black club symbol"):
```text
The character is doing AIR SQUATS: deep squat position, thighs parallel to the
ground, both arms extended straight forward for balance, focused expression.
```

**Burpees** (Bube — Extra-Detail: „wearing a small golden soldier helmet"):
```text
The character is doing a BURPEE JUMP: airborne mid-jump with arms stretched
overhead, feet off the ground, a small shadow beneath, explosive dynamic pose,
motion lines below the feet.
```

## Einbau in die App

Die generierten PNGs (freigestellt oder mit Creme-Hintergrund) nach
`img/pushups.png`, `img/jacks.png`, … legen. In `app.js` ersetzt dann ein
`<image href="img/….png" …>`-Element den jeweiligen `FIGURES`-Eintrag in
`cardSVG()`. Die Dateien zusätzlich in `sw.js` unter `ASSETS` eintragen und
`VERSION` bumpen, sonst fehlen sie offline.
