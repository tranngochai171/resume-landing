export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  { label: 'Frontend', items: ['React 18', 'Next.js', 'TypeScript', 'Tailwind', 'Shadcn/ui', 'Radix', 'MUI', 'Ant Design'] },
  { label: 'Backend', items: ['NestJS', 'Node.js', 'tRPC', 'GraphQL', 'REST', 'Express'] },
  { label: 'Payments', items: ['Stripe', 'Plaid', 'Persona KYC/AML', 'BoldSign'] },
  { label: 'State', items: ['TanStack Query', 'Zustand', 'Jotai', 'Redux Toolkit', 'RHF', 'Zod'] },
  { label: 'Cloud', items: ['AWS', 'Supabase', 'Vercel', 'Azure DevOps', 'Docker'] },
  { label: 'Testing', items: ['Vitest', 'Playwright', 'RTL'] },
];
