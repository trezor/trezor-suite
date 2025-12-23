export * from './redux/analyticsReducer';
export * from './redux/analyticsActions';
export type { AttributeDef, EventDef, EventInstance } from './eventDefinition';

export { EventType } from './sharedEvents/constants';
export { type SuiteSharedAnalyticsEvent } from './sharedEvents/types';

// do not use this directly, it should be used for generating docs
export * as sharedEventsData from './sharedEvents/events';
