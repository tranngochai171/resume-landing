interface Props {
  left: string;
  right: string;
  center?: string;
  className?: string;
}

export function LeaderDots({ left, right, center, className }: Props) {
  return (
    <div
      className={`flex items-center justify-between font-mono text-xs uppercase tracking-widest text-fg-subtle ${className ?? ''}`}
    >
      <span>{left}</span>
      <span className="mx-4 flex-1 border-b border-dotted border-fg-subtle/40" />
      {center && (
        <>
          <span>{center}</span>
          <span className="mx-4 flex-1 border-b border-dotted border-fg-subtle/40" />
        </>
      )}
      <span>{right}</span>
    </div>
  );
}
