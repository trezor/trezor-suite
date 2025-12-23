import * as sharedEventsData from './events';
import { EventInstance } from '../events/eventDefinition';

export const sharedEvents = sharedEventsData;
export type AnySharedEventDef = (typeof sharedEvents)[keyof typeof sharedEvents];
export type AnalyticsSharedEvent = EventInstance<AnySharedEventDef>;
