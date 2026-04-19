---
name: veo-prompting
description: Use when writing or revising Veo 3 / Veo 3.1 video generation prompts for the resume-landing site — covers the official prompt schema, negative prompt field, first/last frame image conditioning, loop-friendly motion, and on-brand defaults (pure black void + teal-cyan #7DD3C8). Trigger on any request for Veo prompts, ambient background video, contact-section loops, or hero video iteration.
---

# Veo 3 Prompting — Resume Landing

Official schema + on-brand defaults for generating Veo 3 / Veo 3.1 video clips for `D:/Works/resume-landing/`.

## Core Formula

Order matters. Google's recommended structure:

```
[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
```

Put camera/framing **first**. Style and ambiance close the prompt.

Audio goes in a **separate sentence** at the end (Veo 3 supports audio; omit for silent ambient loops).

## Field Usage (not inline prose)

Veo 3 accepts multiple fields — use them instead of stuffing everything into one string:

| Field | What goes here |
|-------|---------------|
| `prompt` | The five-part formula above. No "no X, no Y" negatives. |
| `negative_prompt` | Comma-separated list of things to exclude (e.g. `letterbox, cinematic bars, text, logos, people, warm tones`) |
| `image` (first frame) | Reference PNG to condition the opening frame |
| `last_frame` (Veo 3.1) | Reference PNG to condition closing frame — enables clean A→B transitions |
| `aspect_ratio` | `16:9` default for this site |
| `duration_seconds` | 4–8s typical; longer = less motion control |

**Rule:** if you're writing "no X, no Y" inside `prompt`, move it to `negative_prompt`.

**Rule:** if you're writing "start frame: X, end frame: Y" in prose, upload reference images to `image` and `last_frame` instead.

## On-Brand Defaults (locked palette)

Every Veo prompt for this site inherits:

- Background: pure black void, `#000000`, crushed blacks, zero ambient light outside accent
- Accent color: teal-cyan `#7DD3C8` — only chromatic element allowed
- Grain: **none** — clean digital render. Do not include `film grain`, `35mm`, `celluloid`, or analog-film language in prompts. Add `film grain, grain, noise, texture overlay, analog artifact, celluloid` to every negative prompt.
- Lighting: Apple product-reveal / keynote style — clean studio, not cinematic-film emulation
- Pace: extremely slow, deliberate, luxury editorial — never fast, never bouncy
- Frame rate: 24fps
- Composition: full-bleed 16:9 edge-to-edge, **no letterbox bars**
- Negative defaults: `letterbox, cinematic bars, text, watermarks, logos, people, faces, warm tones, purple, pink, saturated colors, generic stock aesthetic`

See `D:/Works/resume-landing/.claude/skills/design-inspiration/SKILL.md` for the full brand system.

## Loop Patterns

**Single-clip seamless loop**
Prompt the start frame and end frame to match via motion design: "motion returns to origin by second 8, final frame matches opening frame." Works for breathing pulses, cyclic drifts.

**Ping-pong stitch (A ↔ B)**
When seamless single-clip fails, or when richer motion is wanted:
1. Generate two still images (Image A, Image B — matched palette/lighting/composition). For Image B use Image A as reference (img2img / `--sref` / Nano Banana reference) so structure matches.
2. Video 1: first frame = A, last frame = B
3. Video 2: first frame = B, last frame = A
4. Concat V1 + V2 → infinite ping-pong loop

```bash
ffmpeg -i v1.mp4 -i v2.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

**ffmpeg auto-reverse (fluid subjects — saves 1 Veo generation)**
If the motion is visually reversible on screen (ink dispersing, smoke, fog, particles, gradient drifts), generate only V1 (A → B) and let ffmpeg reverse it for V2:

```bash
ffmpeg -i v1.mp4 -vf reverse -an v2.mp4
ffmpeg -i v1.mp4 -i v2.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

Half the Veo cost, identical loop quality. **Don't** use this for subjects where reversed time looks wrong (walking people, fabric gravity, growing plants).

Use `-an` (silent) for ambient backgrounds — no audio on decorative video.

## Output Format (always paste-ready)

When delivering prompts to the user, **always wrap each prompt in straight double quotes** as a single flat string, ready to paste directly into the image generator or Veo UI. No YAML blocks, no multi-line code fences, no markdown inside the prompt. One prompt = one quoted string.

- Image prompts: `"<prompt text including embedded Negative: ... clause>"`
- Veo prompts: `"<prompt text including embedded Negative prompt: ..., First frame: ..., Last frame: ..., Aspect ratio: 16:9, Duration: 8 seconds>"`

Keep the underlying structure (cinematography → subject → action → context → style → negatives → frame refs → aspect → duration) but flatten it into one string. The user copies and pastes; they should never have to reformat.

**Example delivery format:**

```
## Image A

"Extreme macro studio shot of ... 1920x1080. Negative: letterbox, cinematic bars, ..."

## Veo Video (A → B)

"Cinematic locked-off macro shot ... 24fps. Negative prompt: ... First frame: ink-A.png. Last frame: ink-B.png. Aspect ratio: 16:9. Duration: 8 seconds."
```

Use the YAML structure below **only as an internal authoring scaffold**, never as final output.

## Prompt Template (internal scaffold)

```
prompt:
  [Cinematography: shot type, camera angle, movement or locked-off, lens].
  [Subject: what the frame contains — abstract or concrete].
  [Action: motion description, pacing cues, direction of movement].
  [Context: environment — for this site almost always "pure black void #000000,
    atmospheric haze, edge-to-edge full 16:9 frame"].
  [Style & Ambiance: "teal-cyan #7DD3C8 as only chromatic accent, crushed blacks,
    35mm film grain, Deakins-style keynote lighting, luxury editorial pace, 24fps"].

negative_prompt: letterbox, cinematic bars, text, watermarks, logos, people,
  faces, warm tones, purple, pink, saturated colors, generic stock aesthetic,
  fast motion, camera shake

image: <path to first frame PNG>
last_frame: <path to last frame PNG>   # Veo 3.1 only
aspect_ratio: 16:9
duration_seconds: 8
```

## Worked Example — Contact Section Ambient Loop

**Concept:** wireframe topography contours drifting vertically.

```
prompt:
  Cinematic locked-off static shot, zero camera movement, wide frame.
  Abstract topographic contour map rendered as hairline 1px glowing isolines
  in teal-cyan #7DD3C8, concentric organic elevation curves mimicking
  cartographic ridge contours.
  Contour field slowly translates vertically upward over 8 seconds, lines
  fade in at bottom edge and fade out at top edge, foreground lines drift
  slightly faster than background for parallax depth.
  Pure black void background, atmospheric haze behind lines, edge-to-edge
  full 16:9 frame.
  crushed blacks, Deakins-style keynote lighting,
  architectural drafting aesthetic, engineering blueprint mood, luxury
  editorial pace, 24fps.

negative_prompt: letterbox, cinematic bars, text, labels, numbers, compass,
  legend, watermarks, logos, people, faces, warm tones, purple, pink,
  saturated colors, fast motion

image: topography-A.png
last_frame: topography-B.png
aspect_ratio: 16:9
duration_seconds: 8
```

## Common Mistakes

| Mistake | Fix |
|--------|-----|
| Stuffing "no X, no Y" into `prompt` | Move to `negative_prompt` field |
| Describing "start frame / end frame" as prose | Upload reference PNGs to `image` + `last_frame` |
| Mixing specific and vague descriptors | Pick specific — "hairline 1px glowing isolines" beats "thin lines" |
| Letterbox bars in output | Add `letterbox, cinematic bars` to negatives; state `full-bleed 16:9 edge-to-edge` explicitly in prompt |
| Seam visible at loop point | Switch to ping-pong stitch (A→B + B→A) |
| Off-brand warm tones sneaking in | Add `warm tones, amber, orange` to `negative_prompt` |
| Too-fast or bouncy motion | Add `luxury editorial pace, extremely slow, 0.5x dreamlike` to prompt + `fast motion` to negatives |
| Audio on ambient background video | Use `-an` in ffmpeg encode or omit audio description |
| Ambiguous macro subject (fabric, smoke, liquid) morphs into creature, limb, or face | Add anti-creature lock to negatives: `creature, organism, animal, limb, arm, leg, torso, muscle, body, figure, humanoid, monster, anatomy, face in smoke`. Also add to prompt: `inanimate still-life, no life inside, nothing underneath`. |
| Prompt delivered as YAML / code fence and user has to reformat to paste | Always deliver as single quoted string. See Output Format section. |

## Wiring Output in Next.js

Standard contact / ambient background pattern:

```tsx
<video
  src="/videos/contact-ambient.mp4"
  poster="/images/contact-poster.jpg"
  autoPlay muted loop playsInline
  className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen"
/>
```

`opacity` + `mix-blend-mode: screen` keep oversized CTA legible. Always provide a `poster` image for `prefers-reduced-motion` users and initial paint.

## Sources

- [Veo prompt guide — Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide)
- [Ultimate prompting guide for Veo 3.1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)
- [DeepMind Veo prompt guide](https://deepmind.google/models/veo/prompt-guide/)
- [Reference images to guide Veo](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/use-reference-images-to-guide-video-generation)
