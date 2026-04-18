'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeUp } from './variants';

type MotionTag = 'div' | 'section' | 'p' | 'h1' | 'h2' | 'h3';

interface Props extends Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'whileInView' | 'viewport'> {
  children: React.ReactNode;
  className?: string;
  as?: MotionTag;
}

export function FadeUp({ children, className, as = 'div', ...rest }: Props) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
