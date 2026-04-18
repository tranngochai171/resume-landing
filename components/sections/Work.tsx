import { SectionNumber } from '@/components/ui/SectionNumber';
import { CaseCard } from './CaseCard';
import { cases } from '@/lib/work-data';

export function Work() {
  return (
    <section id="work" className="bg-bg px-6 py-24 md:px-12 md:py-48">
      <div className="mx-auto max-w-content">
        <SectionNumber number="02" title="Selected Work" />
        {cases.map((c) => (
          <CaseCard key={c.number} case={c} />
        ))}
      </div>
    </section>
  );
}
