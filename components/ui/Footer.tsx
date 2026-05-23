export function Footer() {
  return (
    <footer className="border-t border-fg-subtle/20 px-6 py-12 md:px-12">
      <div className="mx-auto flex max-w-content flex-col gap-4 font-mono text-[10px] uppercase tracking-widest text-fg-subtle md:flex-row md:items-center md:justify-between">
        <span>© 2026 Tran Ngoc Hai · HCMC</span>
        <span className="text-fg-subtle">
          Set in Fraunces &amp; JetBrains Mono · Built with Next.js
        </span>
        <a
          href="#main"
          className="self-start transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:self-auto"
        >
          ↑ Top
        </a>
      </div>
    </footer>
  );
}
