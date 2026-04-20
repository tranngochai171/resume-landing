// lib/analytics/events.ts
export type SectionId =
  | 'hero'
  | 'about'
  | 'work'
  | 'skills'
  | 'timeline'
  | 'contact';

export type AnalyticsEvent =
  | { name: 'resume_download'; props: { source: 'contact' | 'nav' } }
  | { name: 'contact_email'; props?: undefined }
  | { name: 'contact_social'; props: { network: 'github' | 'linkedin' } }
  | { name: 'section_view'; props: { section: SectionId } };

export type EventName = AnalyticsEvent['name'];

export type PropsFor<N extends EventName> = Extract<
  AnalyticsEvent,
  { name: N }
>['props'];
