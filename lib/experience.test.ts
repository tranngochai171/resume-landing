import { describe, expect, it } from 'vitest';
import { capitalize, getYearsOfExperience, yearsInWords } from './experience';

describe('years of experience', () => {
  it('counts from 2020 and follows the calendar year', () => {
    expect(getYearsOfExperience(new Date(2026, 11, 31))).toBe(6);
    expect(getYearsOfExperience(new Date(2027, 0, 1))).toBe(7);
  });

  it('spells the count for headlines, with digits past twenty', () => {
    expect(capitalize(yearsInWords(6))).toBe('Six');
    expect(yearsInWords(7).toUpperCase()).toBe('SEVEN');
    expect(yearsInWords(21)).toBe('21');
  });
});
