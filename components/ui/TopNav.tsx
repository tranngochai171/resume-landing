'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/ui/MobileNav';

export function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-bg/40 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-display text-2xl font-light tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Home"
          >
            T
          </Link>
          <span className="hidden font-mono text-xs uppercase tracking-widest text-fg-muted md:inline">
            Tran Ngoc Hai
          </span>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden items-center gap-8 md:flex">
            {['Work', 'About', 'Ledger', 'Skills'].map((label) => (
              <a
                key={label}
                href={`#${label === 'Ledger' ? 'timeline' : label.toLowerCase()}`}
                className="font-mono text-xs uppercase tracking-widest text-fg-muted transition-colors hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {label}
              </a>
            ))}
          </div>
          <a
            href="#contact"
            className={cn(
              'hidden md:inline-block font-mono text-xs uppercase tracking-widest',
              'rounded-full border border-fg-subtle px-4 py-2',
              'transition-colors hover:border-accent hover:text-accent',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
            )}
          >
            Get in Touch
          </a>
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
