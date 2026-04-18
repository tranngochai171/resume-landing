interface Props {
  number: string;
  title: string;
  id?: string;
  className?: string;
}

export function SectionNumber({ number, title, id, className }: Props) {
  return (
    <div id={id} className={`mb-16 flex items-start gap-6 ${className ?? ''}`}>
      <span className="font-mono text-xs text-fg-subtle">{number}</span>
      <h2 className="font-condensed text-xs font-bold uppercase tracking-widest text-fg-muted">
        {title}
      </h2>
    </div>
  );
}
