export const CAREER_START_YEAR = 2020;

export function getYearsOfExperience(now: Date = new Date()): number {
  return now.getFullYear() - CAREER_START_YEAR;
}
