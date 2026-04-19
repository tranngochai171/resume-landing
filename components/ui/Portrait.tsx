interface Props {
  className?: string;
}

export function Portrait({ className }: Props) {
  return (
    <picture>
      <source
        type="image/avif"
        media="(min-width: 768px)"
        srcSet="/images/portrait/portrait-2026-720.avif"
      />
      <source
        type="image/webp"
        media="(min-width: 768px)"
        srcSet="/images/portrait/portrait-2026-720.webp"
      />
      <source
        type="image/avif"
        srcSet="/images/portrait/portrait-2026-480.avif"
      />
      <source
        type="image/webp"
        srcSet="/images/portrait/portrait-2026-480.webp"
      />
      <img
        src="/images/portrait/portrait-2026-480.jpg"
        alt="Topy Tran"
        width={480}
        height={600}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}
