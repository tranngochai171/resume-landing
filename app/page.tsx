import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { TopNav } from '@/components/ui/TopNav';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Work } from '@/components/sections/Work';
import { Timeline } from '@/components/sections/Timeline';
import { Skills } from '@/components/sections/Skills';
import { Contact } from '@/components/sections/Contact';

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <TopNav />
      <main>
        <Hero />
        <About />
        <Work />
        <Timeline />
        <Skills />
        <Contact />
      </main>
    </SmoothScrollProvider>
  );
}
