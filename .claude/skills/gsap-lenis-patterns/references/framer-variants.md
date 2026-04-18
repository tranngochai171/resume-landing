# Framer Motion Variants

Shared motion variants. One source of truth — avoid drift across sections.

## `fadeUp` variant

```ts
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1],
    },
  },
};
```

## `staggerContainer` variant

```ts
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};
```

## `pillPop` (Skills section)

```ts
export const pillPop = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.33, 1, 0.68, 1] },
  },
};
```

## Usage pattern

```tsx
<motion.div
  variants={staggerContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: '-100px' }}
>
  <motion.h2 variants={fadeUp}>Section Title</motion.h2>
  <motion.p variants={fadeUp}>Body...</motion.p>
</motion.div>
```

## File location

All variants live in `components/motion/variants.ts`. Import from there.
