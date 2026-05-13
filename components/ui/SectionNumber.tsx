interface Props {
  number: string;
  title: string;
  id?: string;
  className?: string;
}

export function SectionNumber({ number, title, id, className }: Props) {
  return (
    <div
      id={id}
      className={`sticky top-20 z-10 mb-16 flex items-start gap-6 py-1 ${className ?? ''}`}
    >
      <span className="font-mono text-xs text-accent">{number}</span>
      <h2 className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
        {title}
      </h2>
    </div>
  );
}
