import { type EventInstance } from './eventDefinition';
import * as sharedEventsData from './events';

export const sharedEvents = sharedEventsData;
export type AnySharedEventDef = (typeof sharedEvents)[keyof typeof sharedEvents];
export type AnalyticsSharedEvents = EventInstance<AnySharedEventDef>;
