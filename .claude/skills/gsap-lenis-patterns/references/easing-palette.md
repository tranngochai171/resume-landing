# Easing Palette — The Only Easings Allowed

## The 3 easings

| Name | Cubic-bezier | Visual | Use for |
|------|--------------|--------|---------|
| `power3.out` | `cubic-bezier(0.215, 0.61, 0.355, 1)` | Fast start, slow end | Section entries, fade-ups |
| `expo.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Extremely sharp start, long settle | Hero name reveal, dramatic moments |
| `power2.out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Gentle, balanced | Hover states, pill pop-ins |

## Usage

**GSAP:**
```js
gsap.to('.el', { opacity: 1, duration: 0.8, ease: 'power3.out' });
```

**Framer Motion:**
```tsx
transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
```

**CSS:**
```css
transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
```

## Banned easings

- `back.out`, `back.inOut`, `elastic.*`, `bounce.*` — too playful, breaks luxury feel
- `linear` — never mechanical
- `ease-in` — things disappearing feel wrong slowing down first
