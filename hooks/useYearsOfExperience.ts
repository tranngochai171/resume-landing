'use client';

import { useEffect, useState } from 'react';
import { BUILD_YEARS, getYearsOfExperience } from '@/lib/experience';

/** Years of experience: the build's value on first render (matches the static HTML), then the visitor's year. */
export function useYearsOfExperience() {
  const [n, setN] = useState(BUILD_YEARS);
  useEffect(() => setN(getYearsOfExperience()), []);
  return n;
}
