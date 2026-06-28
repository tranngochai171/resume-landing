import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { LoadCurtain } from '@/components/motion/LoadCurtain';
import { TopNav } from '@/components/ui/TopNav';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Work } from '@/components/sections/Work';
import { Timeline } from '@/components/sections/Timeline';
import { Skills } from '@/components/sections/Skills';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/ui/Footer';
import { SectionDivider } from '@/components/ui/SectionDivider';

/** The original dark-luxurious elegant landing page (default at `/`, always at `/elegant`). */
export function ElegantHome() {
  return (
    <>
      <LoadCurtain />
      <SmoothScrollProvider>
        <TopNav />
        <main id="main">
          <Hero />
          <SectionDivider />
          <About />
          <SectionDivider />
          <Work />
          <SectionDivider />
          <Timeline />
          <SectionDivider />
          <Skills />
          <SectionDivider />
          <Contact />
        </main>
        <Footer />
      </SmoothScrollProvider>
    </>
  );
}
