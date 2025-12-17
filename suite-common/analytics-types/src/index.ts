export { EventType } from './constants';
export { type SuiteSharedLegacyAnalyticsEvents } from './types';
export { type AnalyticsSharedEvents } from './analyticsEvents';

// do not use this directly, it should be used for generating docs
export * as sharedEventsData from './events';
export type { AttributeDef, EventDef, EventInstance } from './eventDefinition';
