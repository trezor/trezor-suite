import * as sharedEventsData from './events';
import { EventInstance } from '../eventDefinition';

export const sharedEvents = sharedEventsData;
export type AnySharedEventDef = (typeof sharedEvents)[keyof typeof sharedEvents];
export type AnalyticsSharedEvents = EventInstance<AnySharedEventDef>;
