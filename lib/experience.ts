export const CAREER_START_YEAR = 2020;

export function getYearsOfExperience(now: Date = new Date()): number {
  return now.getFullYear() - CAREER_START_YEAR;
}

/**
 * Years of experience in the build's year. The static HTML and the client bundle both inline
 * NEXT_PUBLIC_BUILD_DATE, so rendering this first never mismatches on hydration.
 */
export const BUILD_YEARS = Number(process.env.NEXT_PUBLIC_BUILD_DATE?.slice(0, 4)) - CAREER_START_YEAR || getYearsOfExperience();

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/** 6 -> "six"; digits past twenty. */
export const yearsInWords = (n: number) => WORDS[n] ?? String(n);

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
