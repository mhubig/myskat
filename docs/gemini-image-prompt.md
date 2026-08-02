# Bildgenerierungs-Prompts für die Kartenmotive (Gemini)

Zwei Stil-Varianten: [Set A — Bilderbuch/Tenniel](#set-a--bilderbuch-tenniel)
(flach, passt farblich exakt zur App) und
[Set B — Tim-Burton-Look](#set-b--tim-burton-look) (cineastisch-düster,
jeder Prompt komplett copy-paste-fertig).

## Set A — Bilderbuch (Tenniel)

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

## Set B — Tim-Burton-Look

Cineastisch-düstere Variante, angelehnt an die Kartensoldaten der Roten Königin
aus Tim Burtons Alice-im-Wunderland-Verfilmung. Jeder Prompt ist vollständig
ausformuliert — einfach einzeln kopieren und einfügen. Trotzdem gilt: alle fünf
in **derselben** Session generieren hilft der Konsistenz zusätzlich.

Hinweis zum Einbau: Dieser Stil ist dunkler als die Creme-Karten der App. Die
Prompts verlangen deshalb einen ruhigen, hellen Pergament-Hintergrund mit
sanfter Vignette, damit die Figuren auf dem Kartenblatt funktionieren.

**1 — Push-Ups (Herz):**
```text
A cinematic dark-fantasy character illustration inspired by the gothic,
whimsical aesthetic of Tim Burton's Alice in Wonderland film: a playing-card
soldier of the Red Queen's army reimagined as a muscular CrossFit athlete. Its
tall rectangular torso is a slightly weathered ivory playing card with ornate
baroque corner flourishes and one large deep-red HEART symbol in the center.
It has long, powerfully muscled arms and legs in dark segmented armor,
oversized gauntlets, and a small pale head with big expressive eyes, faint
dark eye shadow and a red fabric sweatband. Mood: whimsical yet slightly
eerie, desaturated palette with deep crimson accents, soft theatrical rim
light, a wisp of fog at the ground. The character is performing PUSH-UPS: low
horizontal plank position, elbows bent, body rigid and straight, gritted
determined expression. Full figure centered, plain light parchment background
with a gentle dark vignette, no text, no watermark, square 1:1 format.
```

**2 — Jumping Jacks (Karo):**
```text
A cinematic dark-fantasy character illustration inspired by the gothic,
whimsical aesthetic of Tim Burton's Alice in Wonderland film: a playing-card
soldier of the Red Queen's army reimagined as a muscular CrossFit athlete. Its
tall rectangular torso is a slightly weathered ivory playing card with ornate
baroque corner flourishes and one large deep-red DIAMOND symbol in the center.
It has long, powerfully muscled arms and legs in dark segmented armor,
oversized gauntlets, and a small pale head with big expressive eyes, faint
dark eye shadow and a red fabric sweatband. Mood: whimsical yet slightly
eerie, desaturated palette with deep crimson accents, soft theatrical rim
light, a wisp of fog at the ground. The character is performing JUMPING
JACKS: caught mid-jump, legs spread wide, both arms raised high in a V above
the head, gleeful manic grin, small motion streaks around hands and feet.
Full figure centered, plain light parchment background with a gentle dark
vignette, no text, no watermark, square 1:1 format.
```

**3 — Crunches (Pik):**
```text
A cinematic dark-fantasy character illustration inspired by the gothic,
whimsical aesthetic of Tim Burton's Alice in Wonderland film: a playing-card
soldier of the Red Queen's army reimagined as a muscular CrossFit athlete. Its
tall rectangular torso is a slightly weathered ivory playing card with ornate
baroque corner flourishes and one large ink-black SPADE symbol in the center.
It has long, powerfully muscled arms and legs in dark segmented armor,
oversized gauntlets, and a small pale head with big expressive eyes, faint
dark eye shadow and a red fabric sweatband. Mood: whimsical yet slightly
eerie, desaturated palette with deep crimson accents, soft theatrical rim
light, a wisp of fog at the ground. The character is performing CRUNCHES:
lying on its back on the misty ground, knees bent, upper body curled up
toward the knees, arms reaching forward, straining clenched expression. Full
figure centered, plain light parchment background with a gentle dark
vignette, no text, no watermark, square 1:1 format.
```

**4 — Air Squats (Kreuz):**
```text
A cinematic dark-fantasy character illustration inspired by the gothic,
whimsical aesthetic of Tim Burton's Alice in Wonderland film: a playing-card
soldier of the Red Queen's army reimagined as a muscular CrossFit athlete. Its
tall rectangular torso is a slightly weathered ivory playing card with ornate
baroque corner flourishes and one large ink-black CLUB symbol in the center.
It has long, powerfully muscled arms and legs in dark segmented armor,
oversized gauntlets, and a small pale head with big expressive eyes, faint
dark eye shadow and a red fabric sweatband. Mood: whimsical yet slightly
eerie, desaturated palette with deep crimson accents, soft theatrical rim
light, a wisp of fog at the ground. The character is performing AIR SQUATS:
deep squat with thighs parallel to the ground, chest upright, both arms
extended straight forward for balance, intensely focused expression. Full
figure centered, plain light parchment background with a gentle dark
vignette, no text, no watermark, square 1:1 format.
```

**5 — Burpees (Bube):**
```text
A cinematic dark-fantasy character illustration inspired by the gothic,
whimsical aesthetic of Tim Burton's Alice in Wonderland film: a playing-card
soldier of the Red Queen's army reimagined as a muscular CrossFit athlete —
this one is the JACK, an elite soldier wearing a small ornate golden knight
helmet with a red plume. Its tall rectangular torso is a slightly weathered
ivory playing card with ornate baroque corner flourishes showing all four
card suit symbols (heart, diamond, spade, club) arranged two by two in the
center. It has long, powerfully muscled arms and legs in dark segmented
armor, oversized gauntlets, and a small pale head with big expressive eyes
and faint dark eye shadow. Mood: whimsical yet slightly eerie, desaturated
palette with deep crimson accents, soft theatrical rim light, a wisp of fog
at the ground. The character is performing a BURPEE JUMP: fully airborne,
arms stretched overhead, feet off the ground, a small shadow and dust puff
beneath, explosive dynamic pose. Full figure centered, plain light parchment
background with a gentle dark vignette, no text, no watermark, square 1:1
format.
```

## Einbau in die App

Die generierten PNGs (freigestellt oder mit Creme-Hintergrund) nach
`img/pushups.png`, `img/jacks.png`, … legen. In `app.js` ersetzt dann ein
`<image href="img/….png" …>`-Element den jeweiligen `FIGURES`-Eintrag in
`cardSVG()`. Die Dateien zusätzlich in `sw.js` unter `ASSETS` eintragen und
`VERSION` bumpen, sonst fehlen sie offline.
